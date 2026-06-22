export class KnowledgeBaseFaqEntity {
  id: string
  userId: string
  question: string
  answer: string
  category?: string
  createdAt: Date
  updatedAt: Date
}
