/**
 * Camada de persistência local.
 * Substitua os métodos por chamadas de API real no futuro.
 */

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : fallback
    } catch {
      return fallback
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.warn('localStorage unavailable')
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key)
  },
}

export const KEYS = {
  AUTH: 'agentai:auth',
  LEADS: 'agentai:leads',
  AGENTS: 'agentai:agents',
  CONVERSATIONS: 'agentai:conversations',
  CRM: 'agentai:crm',
  KNOWLEDGE: 'agentai:knowledge',
  FLOWS: 'agentai:flows',
  SETTINGS: 'agentai:settings',
  PROFILE: 'agentai:profile',
  THEME: 'agentai:theme',
  NOTIFICATIONS: 'agentai:notifications',
} as const
