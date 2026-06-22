export class DriveConfigEntity {
  id: string
  userId: string
  accessToken: string
  refreshToken: string
  folderId: string
  folderName: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class GoogleDriveDocumentEntity {
  id: string
  userId: string
  googleDriveDriveConfigId: string
  googleDriveFileId: string
  googleDriveFileName: string
  googleDriveMimeType: string
  googleDriveIsActive: boolean
  createdAt: Date
  updatedAt: Date
}
