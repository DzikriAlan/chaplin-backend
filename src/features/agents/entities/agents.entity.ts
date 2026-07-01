export class AgentsEntity {
  id: string
  name: string
  description: string | null
  image: string | null
  personalization: string | null
  isDefault: boolean
  embedScript: string | null
  whatsappScript: string | null
  createdAt: Date
  updatedAt: Date
}
