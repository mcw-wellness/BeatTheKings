import {
  BlobServiceClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob'
import { logger } from '@/lib/logger'

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'avatar'

let blobServiceClient: BlobServiceClient | null = null
let containerClient: ReturnType<BlobServiceClient['getContainerClient']> | null = null
let sharedKeyCredential: StorageSharedKeyCredential | null = null

/**
 * Parse connection string to extract account name and key
 */
function parseConnectionString(connStr: string): { accountName: string; accountKey: string } {
  const accountNameMatch = connStr.match(/AccountName=([^;]+)/)
  const accountKeyMatch = connStr.match(/AccountKey=([^;]+)/)

  if (!accountNameMatch || !accountKeyMatch) {
    throw new Error('Invalid connection string format')
  }

  return {
    accountName: accountNameMatch[1],
    accountKey: accountKeyMatch[1],
  }
}

/**
 * Get or create the blob service client and credentials
 */
function initializeClients(): void {
  if (blobServiceClient && sharedKeyCredential) return

  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured')
  }

  const { accountName, accountKey } = parseConnectionString(connectionString)
  sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  containerClient = blobServiceClient.getContainerClient(containerName)
}

/**
 * Get or create the blob container client
 */
function getContainerClient() {
  initializeClients()
  return containerClient!
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
 * Generate a SAS URL for a blob (valid for 24 hours)
 */
export function generateSasUrl(blobPath: string, expiresInHours: number = 24): string {
  initializeClients()

  if (!sharedKeyCredential || !blobServiceClient) {
    throw new Error('Azure Storage not initialized')
  }

  const { accountName } = parseConnectionString(connectionString!)

  const startsOn = new Date()
  const expiresOn = new Date(startsOn.getTime() + expiresInHours * 60 * 60 * 1000)

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse('r'), // Read only
      startsOn,
      expiresOn,
    },
    sharedKeyCredential
  ).toString()

  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobPath}?${sasToken}`
}

/**
 * Get the SAS URL for a default avatar from Azure Blob Storage
 */
export function getDefaultAvatarSasUrl(gender: string, sport: string = 'basketball'): string {
  const genderKey = gender?.toLowerCase() === 'female' ? 'female' : 'male'
  const blobPath = `default/${sport}_${genderKey}.png`

  // In test environment or when Azure isn't configured, return placeholder
  if (!connectionString) {
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${genderKey}&size=128`
  }

  return generateSasUrl(blobPath)
}

/**
 * Get the SAS URL for a user's avatar
 */
export function getUserAvatarSasUrl(userId: string): string {
  const blobPath = `users/${userId}/avatar.png`

  // In test environment or when Azure isn't configured, return a placeholder URL
  if (!connectionString) {
    return `https://placeholder.blob.core.windows.net/avatar/${blobPath}`
  }

  return generateSasUrl(blobPath)
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
