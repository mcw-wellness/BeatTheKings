/**
 * Match Invitations Library
 * Functions for managing scheduled match invitations
 */

import { eq, and } from 'drizzle-orm'
import { matchInvitations, matches, venues, sports, users, avatars } from '@/db/schema'
import type { Database } from '@/db'
import { getUserAvatarSasUrl, getDefaultAvatarSasUrl } from '@/lib/azure-storage'
import { logger } from '@/lib/utils/logger'

// ===========================================
// TYPES
// ===========================================

export interface InvitationPlayer {
  id: string
  name: string | null
  avatar: string
}

export interface InvitationDetail {
  id: string
  sender: InvitationPlayer
  receiver: InvitationPlayer
  venue: { id: string; name: string; district: string | null }
  scheduledAt: string
  status: string
  message: string | null
  createdAt: string
}

interface SendInvitationParams {
  senderId: string
  receiverId: string
  venueId: string
  sportId: string
  scheduledAt: Date
  message?: string
}

// ===========================================
// HELPERS
// ===========================================

async function getPlayerSummary(db: Database, userId: string): Promise<InvitationPlayer> {
  const [user] = await db
    .select({ id: users.id, name: users.name, gender: users.gender })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const [avatar] = await db
    .select({ imageUrl: avatars.imageUrl })
    .from(avatars)
    .where(eq(avatars.userId, userId))
    .limit(1)

  const avatarUrl = avatar?.imageUrl
    ? getUserAvatarSasUrl(userId)
    : getDefaultAvatarSasUrl(user?.gender || 'male')

  return { id: userId, name: user?.name || null, avatar: avatarUrl }
}

// ===========================================
// SEND INVITATION
// ===========================================

export async function sendInvitation(
  db: Database,
  params: SendInvitationParams
): Promise<{ id: string } | { error: string }> {
  const { senderId, receiverId, venueId, sportId, scheduledAt, message } = params

  if (senderId === receiverId) {
    return { error: 'Cannot invite yourself' }
  }

  if (scheduledAt <= new Date()) {
    return { error: 'Scheduled time must be in the future' }
  }

  // Verify venue exists
  const [venue] = await db
    .select({ id: venues.id })
    .from(venues)
    .where(eq(venues.id, venueId))
    .limit(1)

  if (!venue) {
    return { error: 'Venue not found' }
  }

  // Verify sport exists
  const [sport] = await db
    .select({ id: sports.id })
    .from(sports)
    .where(eq(sports.id, sportId))
    .limit(1)

  if (!sport) {
    return { error: 'Sport not found' }
  }

  // Check for duplicate pending invitation
  const [existing] = await db
    .select({ id: matchInvitations.id })
    .from(matchInvitations)
    .where(
      and(
        eq(matchInvitations.senderId, senderId),
        eq(matchInvitations.receiverId, receiverId),
        eq(matchInvitations.status, 'pending')
      )
    )
    .limit(1)

  if (existing) {
    return { error: 'Already have a pending invitation to this player' }
  }

  const [invitation] = await db
    .insert(matchInvitations)
    .values({ senderId, receiverId, venueId, sportId, scheduledAt, message })
    .returning()

  logger.info({ invitationId: invitation.id, senderId, receiverId }, 'Match invitation sent')
  return { id: invitation.id }
}

// ===========================================
// GET INVITATIONS
// ===========================================

export async function getInvitations(
  db: Database,
  userId: string,
  type: 'received' | 'sent'
): Promise<InvitationDetail[]> {
  const condition =
    type === 'received'
      ? eq(matchInvitations.receiverId, userId)
      : eq(matchInvitations.senderId, userId)

  const rows = await db.select().from(matchInvitations).where(condition)

  const details: InvitationDetail[] = []
  for (const row of rows) {
    const [sender, receiver] = await Promise.all([
      getPlayerSummary(db, row.senderId),
      getPlayerSummary(db, row.receiverId),
    ])

    const [venue] = await db
      .select({ id: venues.id, name: venues.name, district: venues.district })
      .from(venues)
      .where(eq(venues.id, row.venueId))
      .limit(1)

    details.push({
      id: row.id,
      sender,
      receiver,
      venue: venue || { id: row.venueId, name: 'Unknown', district: null },
      scheduledAt: row.scheduledAt.toISOString(),
      status: row.status,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
    })
  }

  return details
}

// ===========================================
// RESPOND TO INVITATION
// ===========================================

export async function respondToInvitation(
  db: Database,
  invitationId: string,
  userId: string,
  accept: boolean
): Promise<{ status: string; matchId?: string } | { error: string }> {
  const [invitation] = await db
    .select()
    .from(matchInvitations)
    .where(eq(matchInvitations.id, invitationId))
    .limit(1)

  if (!invitation) {
    return { error: 'Invitation not found' }
  }

  if (invitation.receiverId !== userId) {
    return { error: 'Not authorized to respond to this invitation' }
  }

  if (invitation.status !== 'pending') {
    return { error: 'Invitation is no longer pending' }
  }

  const newStatus = accept ? 'accepted' : 'declined'

  await db
    .update(matchInvitations)
    .set({ status: newStatus, respondedAt: new Date() })
    .where(eq(matchInvitations.id, invitationId))

  if (!accept) {
    return { status: 'declined' }
  }

  // Create scheduled match
  const [match] = await db
    .insert(matches)
    .values({
      venueId: invitation.venueId,
      sportId: invitation.sportId,
      player1Id: invitation.senderId,
      player2Id: invitation.receiverId,
      invitationId: invitation.id,
      status: 'scheduled',
    })
    .returning()

  logger.info({ matchId: match.id, invitationId }, 'Scheduled match created from invitation')
  return { status: 'accepted', matchId: match.id }
}

// ===========================================
// CANCEL INVITATION
// ===========================================

export async function cancelInvitation(
  db: Database,
  invitationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const [invitation] = await db
    .select()
    .from(matchInvitations)
    .where(eq(matchInvitations.id, invitationId))
    .limit(1)

  if (!invitation) {
    return { success: false, error: 'Invitation not found' }
  }

  if (invitation.senderId !== userId) {
    return { success: false, error: 'Only the sender can cancel an invitation' }
  }

  if (invitation.status !== 'pending') {
    return { success: false, error: 'Only pending invitations can be cancelled' }
  }

  await db
    .update(matchInvitations)
    .set({ status: 'cancelled' })
    .where(eq(matchInvitations.id, invitationId))

  return { success: true }
}

// ===========================================
// NOTIFICATION COUNT
// ===========================================

export async function getPendingInvitationCount(
  db: Database,
  userId: string
): Promise<number> {
  const rows = await db
    .select({ id: matchInvitations.id })
    .from(matchInvitations)
    .where(
      and(
        eq(matchInvitations.receiverId, userId),
        eq(matchInvitations.status, 'pending')
      )
    )

  return rows.length
}
