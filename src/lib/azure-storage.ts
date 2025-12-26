import { BlobServiceClient } from '@azure/storage-blob'
import { logger } from '@/lib/logger'

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'avatar'
const baseUrl = process.env.NEXT_PUBLIC_AZURE_STORAGE_URL

let containerClient: ReturnType<BlobServiceClient['getContainerClient']> | null = null

/**
 * Get or create the blob container client
 */
function getContainerClient() {
  if (containerClient) return containerClient

  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured')
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  containerClient = blobServiceClient.getContainerClient(containerName)
  return containerClient
}

/**
 * Upload avatar image to Azure Blob Storage
 * Path: users/{userId}/avatar.png
 */
export async function uploadAvatar(userId: string, imageBuffer: Buffer): Promise<string> {
  const container = getContainerClient()
  const blobPath = `users/${userId}/avatar.png`
  const blockBlobClient = container.getBlockBlobClient(blobPath)

  await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
    blobHTTPHeaders: { blobContentType: 'image/png' },
  })

  logger.info({ userId, blobPath }, 'Avatar uploaded to Azure Blob Storage')

  return blockBlobClient.url
}

/**
 * Get the URL for a default avatar
 */
export function getDefaultAvatarUrl(gender: string, sport: string = 'basketball'): string {
  const genderKey = gender.toLowerCase() === 'female' ? 'female' : 'male'
  return `${baseUrl}/${containerName}/default/${sport}_${genderKey}.png`
}

/**
 * Get the URL for a user's avatar
 */
export function getUserAvatarUrl(userId: string): string {
  return `${baseUrl}/${containerName}/users/${userId}/avatar.png`
}

/**
 * Check if a blob exists
 */
export async function avatarExists(userId: string): Promise<boolean> {
  try {
    const container = getContainerClient()
    const blobPath = `users/${userId}/avatar.png`
    const blockBlobClient = container.getBlockBlobClient(blobPath)
    return await blockBlobClient.exists()
  } catch (error) {
    logger.error({ error, userId }, 'Failed to check if avatar exists')
    return false
  }
}

/**
 * Delete a user's avatar
 */
export async function deleteAvatar(userId: string): Promise<boolean> {
  try {
    const container = getContainerClient()
    const blobPath = `users/${userId}/avatar.png`
    const blockBlobClient = container.getBlockBlobClient(blobPath)
    await blockBlobClient.deleteIfExists()
    logger.info({ userId }, 'Avatar deleted from Azure Blob Storage')
    return true
  } catch (error) {
    logger.error({ error, userId }, 'Failed to delete avatar')
    return false
  }
}
