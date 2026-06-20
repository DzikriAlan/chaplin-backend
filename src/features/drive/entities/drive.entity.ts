export class DriveConfigEntity {
  id: string
  folderId: string
  folderName: string | null
  refreshToken: string
  lastSyncAt: Date | null
  createdAt: Date
  updatedAt: Date
}
