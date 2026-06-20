export class QuestionsEntity {
  id: string
  topic: string
  type: string
  question: string
  options: unknown
  answer: string
  discussion: string | null
  createdAt: Date
}
