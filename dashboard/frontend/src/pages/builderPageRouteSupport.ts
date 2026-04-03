import { getAlgorithmFieldSchema } from "@/lib/dslMutations"
import type {
  ASTAlgoSpec,
  ASTModelRef,
  ASTPluginRef,
} from "@/types/dsl"
import type {
  RouteAlgoInput,
  RouteModelInput,
  RoutePluginInput,
} from "@/lib/dslMutations"

export interface ValidationIssue {
  level: "error" | "warning" | "constraint"
  message: string
}

export function generateRouteDslPreview(
  routeName: string,
  description: string,
  priority: number,
  whenExpr: string,
  models: RouteModelInput[],
  algorithm: RouteAlgoInput | undefined,
  plugins: RoutePluginInput[],
): string {
  const descPart = description.trim()
    ? ` (description = "${description.trim()}")`
    : ""
  const lines: string[] = [`ROUTE ${routeName}${descPart} {`]
  lines.push(`  PRIORITY ${priority}`)
  if (whenExpr.trim()) {
    lines.push("")
    lines.push(`  WHEN ${whenExpr.trim().replace(/\s+/g, " ")}`)
  }
  if (models.length > 0) {
    lines.push("")
    const modelStrs = models
      .filter((m) => m.model.trim())
      .map((m) => {
        const attrs: string[] = []
        if (m.reasoning) attrs.push(`reasoning = true`)
        if (m.effort) attrs.push(`effort = "${m.effort}"`)
        if (m.paramSize) attrs.push(`param_size = "${m.paramSize}"`)
        if (m.weight !== undefined) attrs.push(`weight = ${m.weight}`)
        const attrStr = attrs.length > 0 ? ` (${attrs.join(", ")})` : ""
        return `"${m.model}"${attrStr}`
      })
    if (modelStrs.length === 1) {
      lines.push(`  MODEL ${modelStrs[0]}`)
    } else if (modelStrs.length > 1) {
      lines.push(`  MODEL ${modelStrs.join(",\n        ")}`)
    }
  }
  if (algorithm?.algoType) {
    lines.push("")
    const aFields = Object.entries(algorithm.fields).filter(
      ([, v]) => v !== undefined && v !== "",
    )
    if (aFields.length > 0) {
      lines.push(`  ALGORITHM ${algorithm.algoType} {`)
      aFields.forEach(([k, v]) => {
        let formatted: string
        if (Array.isArray(v)) formatted = `[${v.join(", ")}]`
        else if (typeof v === "string") formatted = `"${v}"`
        else formatted = String(v)
        lines.push(`    ${k}: ${formatted}`)
      })
      lines.push(`  }`)
    } else {
      lines.push(`  ALGORITHM ${algorithm.algoType}`)
    }
  }
  if (plugins.length > 0) {
    lines.push("")
    plugins.forEach((p) => {
      if (p.fields && Object.keys(p.fields).length > 0) {
        lines.push(`  PLUGIN ${p.name} {`)
        Object.entries(p.fields).forEach(([k, v]) => {
          let formatted: string
          if (Array.isArray(v)) formatted = `[${v.join(", ")}]`
          else if (typeof v === "string") formatted = `"${v}"`
          else formatted = String(v)
          lines.push(`    ${k}: ${formatted}`)
        })
        lines.push(`  }`)
      } else {
        lines.push(`  PLUGIN ${p.name}`)
      }
    })
  }
  lines.push("}")
  return lines.join("\n")
}

export function validateRouteInput(
  routeName: string,
  models: RouteModelInput[],
  algorithm: RouteAlgoInput | undefined,
  _plugins: RoutePluginInput[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!routeName.trim()) {
    issues.push({ level: "error", message: "Route name is required" })
  }

  const validModels = models.filter((m) => m.model.trim())
  if (validModels.length === 0) {
    issues.push({
      level: "warning",
      message: "No model specified — route needs at least one MODEL",
    })
  }

  if (algorithm?.algoType) {
    const schema = getAlgorithmFieldSchema(algorithm.algoType)

    schema
      .filter((f) => f.required)
      .forEach((f) => {
        const v = algorithm.fields[f.key]
        if (
          v === undefined ||
          v === "" ||
          v === null ||
          (Array.isArray(v) && v.length === 0)
        ) {
          issues.push({
            level: "error",
            message: `Algorithm field "${f.label}" is required`,
          })
        }
      })

    const fields = algorithm.fields
    if (algorithm.algoType === "confidence") {
      const t = fields["threshold"]
      if (
        t !== undefined &&
        t !== "" &&
        typeof t === "number" &&
        (t < -100 || t > 0)
      ) {
        issues.push({
          level: "warning",
          message: `Threshold ${t} — typically negative log-prob (e.g. -1.0)`,
        })
      }
    }
    if (algorithm.algoType === "remom") {
      const mc = fields["max_concurrent"]
      if (mc !== undefined && mc !== "" && typeof mc === "number" && mc < 0) {
        issues.push({
          level: "error",
          message: `max_concurrent cannot be negative (got ${mc})`,
        })
      }
      const temp = fields["temperature"]
      if (
        temp !== undefined &&
        temp !== "" &&
        typeof temp === "number" &&
        temp < 0
      ) {
        issues.push({
          level: "error",
          message: `temperature cannot be negative (got ${temp})`,
        })
      }
    }
    if (algorithm.algoType === "elo") {
      const k = fields["k_factor"]
      if (k !== undefined && k !== "" && typeof k === "number" && k <= 0) {
        issues.push({
          level: "warning",
          message: `k_factor should be positive (got ${k})`,
        })
      }
    }
    if (algorithm.algoType === "latency_aware") {
      for (const key of ["tpot_percentile", "ttft_percentile"]) {
        const v = fields[key]
        if (
          v !== undefined &&
          v !== "" &&
          typeof v === "number" &&
          (v < 1 || v > 100)
        ) {
          issues.push({
            level: "error",
            message: `${key} must be 1-100 (got ${v})`,
          })
        }
      }
    }
    if (algorithm.algoType === "ratings" || algorithm.algoType === "remom") {
      const mc = fields["max_concurrent"]
      if (mc !== undefined && mc !== "" && typeof mc === "number" && mc < 0) {
        issues.push({
          level: "error",
          message: `max_concurrent cannot be negative (got ${mc})`,
        })
      }
    }

    if (
      validModels.length < 2 &&
      ["confidence", "ratings", "elo", "hybrid", "automix"].includes(
        algorithm.algoType,
      )
    ) {
      issues.push({
        level: "constraint",
        message: `Algorithm "${algorithm.algoType}" works best with multiple models`,
      })
    }
  }

  return issues
}

export function astModelToInput(m: ASTModelRef): RouteModelInput {
  return {
    model: m.model,
    reasoning: m.reasoning,
    effort: m.effort,
    lora: m.lora,
    paramSize: m.paramSize,
    weight: m.weight,
    reasoningFamily: m.reasoningFamily,
  }
}

export function astAlgoToInput(a?: ASTAlgoSpec): RouteAlgoInput | undefined {
  if (!a) return undefined
  return { algoType: a.algoType, fields: { ...a.fields } }
}

export function astPluginRefToInput(p: ASTPluginRef): RoutePluginInput {
  return { name: p.name, fields: p.fields ? { ...p.fields } : undefined }
}
