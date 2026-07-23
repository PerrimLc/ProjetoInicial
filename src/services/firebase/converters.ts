import { Timestamp } from 'firebase/firestore'

export function converterTimestamps<T>(data: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    result[key] = value instanceof Timestamp ? value.toDate() : value
  }
  return result as T
}
