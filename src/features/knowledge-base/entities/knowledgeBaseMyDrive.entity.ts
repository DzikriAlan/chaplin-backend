export class MyDriveFolderEntity {
  id: string
  userId: string
  myDriveFolderName: string
  myDriveDescription?: string
  createdAt: Date
  updatedAt: Date
}

export class MyDriveFileEntity {
  id: string
  userId: string
  myDriveFolderId: string
  myDriveFileName: string
  myDriveMimeType: string
  myDriveFileUrl: string
  myDriveSize: number
  createdAt: Date
  updatedAt: Date
}
