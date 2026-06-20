export class ChatHistoryEntity {
  id: string
  sessionId: string
  role: string
  content: string
  sources: unknown
  createdAt: Date
}

export class ChatSessionEntity {
  sessionId: string
  title: string | null
  createdAt: Date
  updatedAt: Date
}
