export function tryParseValue(raw: string): unknown {
  const trimmed = raw.trim()
  if (trimmed === "true") return true
  if (trimmed === "false") return false
  if (trimmed === "") return ""
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10)
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed)
  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed === "object") return parsed
  } catch {
    /* not JSON */
  }
  return raw
}
