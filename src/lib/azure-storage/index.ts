import {
  BlobServiceClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob'
import { logger } from '@/lib/utils/logger'

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads'

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
 * Get the container client
 */
function getContainerClient() {
  initializeClients()
  return containerClient!
}

/**
 * Upload avatar image to Azure Blob Storage
 * Path: avatars/users/{userId}/avatar.png
 */
export async function uploadAvatar(userId: string, imageBuffer: Buffer): Promise<string> {
  const container = getContainerClient()
  const blobPath = `avatars/users/${userId}/avatar.png`
  const blockBlobClient = container.getBlockBlobClient(blobPath)

  await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
    blobHTTPHeaders: { blobContentType: 'image/png' },
  })

  logger.info({ userId, blobPath }, 'Avatar uploaded to Azure Blob Storage')

  return blockBlobClient.url
}

/**
 * Upload profile picture to Azure Blob Storage
 * Path: profiles/{userId}/photo.{ext}
 */
export async function uploadProfilePicture(
  userId: string,
  imageBuffer: Buffer,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const container = getContainerClient()
  const ext = contentType.split('/')[1] || 'jpg'
  const blobPath = `profiles/${userId}/photo.${ext}`
  const blockBlobClient = container.getBlockBlobClient(blobPath)

  await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  })

  logger.info({ userId, blobPath }, 'Profile picture uploaded to Azure Blob Storage')

  return blobPath
}

/**
 * Get the SAS URL for a user's profile picture
 */
export function getProfilePictureSasUrl(userId: string, ext: string = 'jpeg'): string {
  const blobPath = `profiles/${userId}/photo.${ext}`

  if (!connectionString) {
    return `https://placeholder.blob.core.windows.net/${containerName}/${blobPath}`
  }

  return generateSasUrl(blobPath)
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
 * Get the URL for a default avatar placeholder
 * Uses DiceBear API since we don't have pre-uploaded default avatars
 */
export function getDefaultAvatarSasUrl(gender: string, sport: string = 'basketball'): string {
  const genderKey = gender?.toLowerCase() === 'female' ? 'female' : 'male'
  // Use DiceBear placeholder for default avatars
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${sport}_${genderKey}&size=512`
}

/**
 * Get the SAS URL for a user's avatar
 */
export function getUserAvatarSasUrl(userId: string): string {
  const blobPath = `avatars/users/${userId}/avatar.png`

  // In test environment or when Azure isn't configured, return a placeholder URL
  if (!connectionString) {
    return `https://placeholder.blob.core.windows.net/${containerName}/${blobPath}`
  }

  return generateSasUrl(blobPath)
}

/**
 * Check if a blob exists
 */
export async function avatarExists(userId: string): Promise<boolean> {
  try {
    const container = getContainerClient()
    const blobPath = `avatars/users/${userId}/avatar.png`
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
    const blobPath = `avatars/users/${userId}/avatar.png`
    const blockBlobClient = container.getBlockBlobClient(blobPath)
    await blockBlobClient.deleteIfExists()
    logger.info({ userId }, 'Avatar deleted from Azure Blob Storage')
    return true
  } catch (error) {
    logger.error({ error, userId }, 'Failed to delete avatar')
    return false
  }
}

/**
 * Download user's profile picture as base64
 */
export async function getProfilePictureBase64(userId: string): Promise<string | null> {
  try {
    const container = getContainerClient()
    // Try jpeg first, then jpg
    for (const ext of ['jpeg', 'jpg', 'png']) {
      const blobPath = `profiles/${userId}/photo.${ext}`
      const blockBlobClient = container.getBlockBlobClient(blobPath)

      if (await blockBlobClient.exists()) {
        const downloadResponse = await blockBlobClient.download()
        const chunks: Buffer[] = []

        for await (const chunk of downloadResponse.readableStreamBody as NodeJS.ReadableStream) {
          chunks.push(Buffer.from(chunk))
        }

        const buffer = Buffer.concat(chunks)
        const base64 = buffer.toString('base64')
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'

        logger.info({ userId, blobPath }, 'Profile picture downloaded')
        return `data:${mimeType};base64,${base64}`
      }
    }

    logger.warn({ userId }, 'Profile picture not found')
    return null
  } catch (error) {
    logger.error({ error, userId }, 'Failed to download profile picture')
    return null
  }
}

/**
 * Download user's avatar image as base64
 */
export async function getAvatarBase64(userId: string): Promise<string | null> {
  try {
    const container = getContainerClient()
    const blobPath = `avatars/users/${userId}/avatar.png`
    const blockBlobClient = container.getBlockBlobClient(blobPath)

    if (!(await blockBlobClient.exists())) {
      logger.warn({ userId }, 'Avatar not found')
      return null
    }

    const downloadResponse = await blockBlobClient.download()
    const chunks: Buffer[] = []

    for await (const chunk of downloadResponse.readableStreamBody as NodeJS.ReadableStream) {
      chunks.push(Buffer.from(chunk))
    }

    const buffer = Buffer.concat(chunks)
    const base64 = buffer.toString('base64')

    logger.info({ userId, blobPath }, 'Avatar downloaded')
    return `data:image/png;base64,${base64}`
  } catch (error) {
    logger.error({ error, userId }, 'Failed to download avatar')
    return null
  }
}

/**
 * Upload match video to Azure Blob Storage
 * Path: matches/{matchId}/{timestamp}.mp4
 */
export async function uploadMatchVideo(matchId: string, videoBuffer: Buffer): Promise<string> {
  const container = getContainerClient()
  const timestamp = Date.now()
  const blobPath = `matches/${matchId}/${timestamp}.mp4`
  const blockBlobClient = container.getBlockBlobClient(blobPath)

  await blockBlobClient.upload(videoBuffer, videoBuffer.length, {
    blobHTTPHeaders: { blobContentType: 'video/mp4' },
  })

  logger.info({ matchId, blobPath }, 'Match video uploaded to Azure Blob Storage')

  // Return SAS URL for the video (needed for AI analysis)
  return generateSasUrl(blobPath, 1) // 1 hour expiry for analysis
}

/**
 * Get the SAS URL for a match video
 */
export function getMatchVideoSasUrl(matchId: string, filename: string): string {
  const blobPath = `matches/${matchId}/${filename}`

  if (!connectionString) {
    return `https://placeholder.blob.core.windows.net/${containerName}/${blobPath}`
  }

  return generateSasUrl(blobPath)
}

/**
 * Save match analysis JSON to Azure Blob Storage
 * Path: matches/{matchId}/analysis.json
 */
export async function saveMatchAnalysis(matchId: string, analysis: object): Promise<string> {
  const container = getContainerClient()
  const blobPath = `matches/${matchId}/analysis.json`
  const blockBlobClient = container.getBlockBlobClient(blobPath)

  const jsonContent = JSON.stringify(analysis, null, 2)
  const buffer = Buffer.from(jsonContent, 'utf-8')

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  })

  logger.info({ matchId, blobPath }, 'Match analysis saved to Azure Blob Storage')

  return generateSasUrl(blobPath)
}
