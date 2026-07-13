import { BlobServiceClient } from '@azure/storage-blob'
import { createReadStream } from 'node:fs'
import type { Readable } from 'node:stream'
import env from '#start/env'

const client = BlobServiceClient.fromConnectionString(env.get('AZURE_STORAGE_CONNECTION_STRING'))
const container = client.getContainerClient(env.get('AZURE_STORAGE_CONTAINER'))

export async function uploadBlob(blobName: string, filePath: string, mimeType: string, size: number): Promise<void> {
  const blockBlob = container.getBlockBlobClient(blobName)
  await blockBlob.uploadStream(createReadStream(filePath) as Readable, size, undefined, {
    blobHTTPHeaders: { blobContentType: mimeType },
  })
}

export async function downloadBlob(blobName: string): Promise<Readable> {
  const blockBlob = container.getBlockBlobClient(blobName)
  const response = await blockBlob.download()
  return response.readableStreamBody as Readable
}

export async function deleteBlob(blobName: string): Promise<void> {
  const blockBlob = container.getBlockBlobClient(blobName)
  await blockBlob.deleteIfExists()
}
