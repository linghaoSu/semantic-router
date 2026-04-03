import type {
  DSLFieldObject,
  DSLFieldScalar,
  DSLFieldValue,
} from "@/types/dsl"
import { serializeFields } from "@/lib/dslMutations"

export function generateSignalDslPreview(
  signalType: string,
  signalName: string,
  fields: DSLFieldObject,
): string {
  const body = serializeFields(fields)
  if (!body.trim()) {
    return `SIGNAL ${signalType} ${signalName} {}`
  }
  return `SIGNAL ${signalType} ${signalName} {\n${body}\n}`
}

export function generateGlobalDslPreview(fields: DSLFieldObject): string {
  return generateGlobalOverridePreview(fields)
}

function yamlIndent(level: number): string {
  return "  ".repeat(level)
}

function yamlScalar(value: DSLFieldScalar): string {
  if (typeof value === "string") {
    if (
      value === "" ||
      /[:#{}[\],&*!?|>'"%@`]/.test(value) ||
      /^\s|\s$/.test(value) ||
      /^(true|false|null|yes|no|on|off)$/i.test(value) ||
      /^-?\d+(\.\d+)?$/.test(value)
    ) {
      return JSON.stringify(value)
    }
    return value
  }
  return String(value)
}

function yamlObjectEntries(value: DSLFieldObject): Array<[string, DSLFieldValue]> {
  return Object.entries(value).filter(
    ([, childValue]) => childValue !== undefined && childValue !== null,
  ) as Array<[string, DSLFieldValue]>
}

function isDSLFieldObject(value: DSLFieldValue): value is DSLFieldObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function appendYamlField(
  lines: string[],
  key: string,
  value: DSLFieldValue,
  level: number,
): void {
  if (value === undefined || value === null) return

  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${yamlIndent(level)}${key}: []`)
      return
    }

    const simple = value.every(
      (item) =>
        item === null ||
        item === undefined ||
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean",
    )
    if (simple) {
      const items = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => yamlScalar(item as DSLFieldScalar))
      lines.push(`${yamlIndent(level)}${key}: [${items.join(", ")}]`)
      return
    }

    lines.push(`${yamlIndent(level)}${key}:`)
    value.forEach((item) => appendYamlArrayItem(lines, item, level + 1))
    return
  }

  if (isDSLFieldObject(value)) {
    const entries = yamlObjectEntries(value)
    if (entries.length === 0) {
      lines.push(`${yamlIndent(level)}${key}: {}`)
      return
    }

    lines.push(`${yamlIndent(level)}${key}:`)
    appendYamlObject(lines, value, level + 1)
    return
  }

  lines.push(`${yamlIndent(level)}${key}: ${yamlScalar(value as DSLFieldScalar)}`)
}

function appendYamlObject(
  lines: string[],
  value: DSLFieldObject,
  level: number,
): void {
  yamlObjectEntries(value).forEach(([childKey, childValue]) =>
    appendYamlField(lines, childKey, childValue, level),
  )
}

function appendYamlArrayItem(
  lines: string[],
  value: DSLFieldValue,
  level: number,
): void {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    lines.push(`${yamlIndent(level)}- ${yamlScalar(value as DSLFieldScalar)}`)
    return
  }

  if (Array.isArray(value)) {
    lines.push(`${yamlIndent(level)}-`)
    value.forEach((item) => appendYamlArrayItem(lines, item, level + 1))
    return
  }

  if (!isDSLFieldObject(value)) {
    lines.push(`${yamlIndent(level)}- ${String(value)}`)
    return
  }

  const entries = yamlObjectEntries(value)
  if (entries.length === 0) {
    lines.push(`${yamlIndent(level)}- {}`)
    return
  }

  const [firstKey, firstValue] = entries[0]
  if (
    firstValue === null ||
    firstValue === undefined ||
    typeof firstValue === "string" ||
    typeof firstValue === "number" ||
    typeof firstValue === "boolean"
  ) {
    lines.push(
      `${yamlIndent(level)}- ${firstKey}: ${yamlScalar(firstValue as DSLFieldScalar)}`,
    )
  } else {
    lines.push(`${yamlIndent(level)}- ${firstKey}:`)
    if (isDSLFieldObject(firstValue)) {
      appendYamlObject(lines, firstValue, level + 1)
    } else {
      appendYamlArrayItem(lines, firstValue, level + 1)
    }
  }
  entries.slice(1).forEach(([childKey, childValue]) =>
    appendYamlField(lines, childKey, childValue, level + 1),
  )
}

export function generateGlobalOverridePreview(fields: DSLFieldObject): string {
  const lines: string[] = []
  yamlObjectEntries(fields).forEach(([key, value]) => appendYamlField(lines, key, value, 1))

  if (lines.length === 0) {
    return "global: {}"
  }

  return ["global:", ...lines].join("\n")
}
