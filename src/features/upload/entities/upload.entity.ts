export class UploadFileEntity {
  id: string
  name: string
  size: bigint
  mimeType: string
  storagePath: string
  folderId: string | null
  createdAt: Date
  updatedAt: Date
}

export class UploadFolderEntity {
  id: string
  name: string
  parentId: string | null
  createdAt: Date
  updatedAt: Date
}
