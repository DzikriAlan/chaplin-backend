export class UsageEntity {
  id: string
  userId: string
  activityType: string
  senderName: string | null
  deduction: number
  balanceBefore: number
  balanceAfter: number
  createdAt: Date
}
