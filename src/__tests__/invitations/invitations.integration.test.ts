/**
 * Match Invitation Integration Tests
 * Full flow tests with real PGLite database
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDb, closeTestDb, clearTestDb, testFactories } from '@/db/test-utils'
import { matches, matchInvitations } from '@/db/schema'
import {
  sendInvitation,
  getInvitations,
  respondToInvitation,
  cancelInvitation,
  getPendingInvitationCount,
} from '@/lib/invitations'
import type { Database } from '@/db'

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

// Mock azure-storage (avatar URLs)
vi.mock('@/lib/azure-storage', () => ({
  getUserAvatarSasUrl: (id: string) => `https://avatar/${id}`,
  getDefaultAvatarSasUrl: (gender: string) => `https://default/${gender}`,
}))

let db: Database

beforeAll(async () => {
  db = await createTestDb()
})

afterAll(async () => {
  await closeTestDb()
})

beforeEach(async () => {
  await clearTestDb(db)
})

/** Helper: create sender, receiver, venue, sport */
async function createTestData() {
  const country = await testFactories.createCountry(db)
  const city = await testFactories.createCity(db, country.id)
  const sender = await testFactories.createUser(db, { name: 'Sender' })
  const receiver = await testFactories.createUser(db, { name: 'Receiver' })
  const venue = await testFactories.createVenue(db, city.id, { name: 'Weghuberpark' })
  const sport = await testFactories.createSport(db, { name: 'Basketball', slug: 'basketball' })
  return { sender, receiver, venue, sport, city, country }
}

describe('Match Invitation Integration Tests', () => {
  describe('sendInvitation', () => {
    it('should create a pending invitation', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const result = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      expect('id' in result).toBe(true)
      if ('id' in result) {
        const [inv] = await db
          .select()
          .from(matchInvitations)
          .where(eq(matchInvitations.id, result.id))
        expect(inv.status).toBe('pending')
        expect(inv.senderId).toBe(sender.id)
        expect(inv.receiverId).toBe(receiver.id)
      }
    })

    it('should save optional message', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const result = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
        message: 'Let\'s play!',
      })

      expect('id' in result).toBe(true)
      if ('id' in result) {
        const [inv] = await db
          .select()
          .from(matchInvitations)
          .where(eq(matchInvitations.id, result.id))
        expect(inv.message).toBe('Let\'s play!')
      }
    })

    it('should reject self-invitation', async () => {
      const { sender, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const result = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: sender.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Cannot invite yourself')
      }
    })

    it('should reject past scheduled time', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const pastDate = new Date('2020-01-01T10:00:00Z')

      const result = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: pastDate,
      })

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Scheduled time must be in the future')
      }
    })

    it('should reject non-existent venue', async () => {
      const { sender, receiver, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const result = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: '00000000-0000-0000-0000-000000000000',
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Venue not found')
      }
    })

    it('should reject non-existent sport', async () => {
      const { sender, receiver, venue } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const result = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: '00000000-0000-0000-0000-000000000000',
        scheduledAt: tomorrow,
      })

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Sport not found')
      }
    })

    it('should reject duplicate pending invitation', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      const result = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      })

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Already have a pending invitation to this player')
      }
    })

    it('should allow new invitation after previous was declined', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      // Send and decline first
      const first = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })
      if ('id' in first) {
        await respondToInvitation(db, first.id, receiver.id, false)
      }

      // Second invitation should work
      const second = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      })

      expect('id' in second).toBe(true)
    })
  })

  describe('respondToInvitation', () => {
    it('should accept and create scheduled match', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const inv = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      expect('id' in inv).toBe(true)
      if (!('id' in inv)) return

      const result = await respondToInvitation(db, inv.id, receiver.id, true)

      expect('status' in result && !('error' in result)).toBe(true)
      if ('matchId' in result) {
        expect(result.status).toBe('accepted')
        expect(result.matchId).toBeDefined()

        // Verify match was created
        const [match] = await db
          .select()
          .from(matches)
          .where(eq(matches.id, result.matchId!))
        expect(match.status).toBe('scheduled')
        expect(match.invitationId).toBe(inv.id)
        expect(match.player1Id).toBe(sender.id)
        expect(match.player2Id).toBe(receiver.id)
        expect(match.venueId).toBe(venue.id)
        expect(match.sportId).toBe(sport.id)
      }

      // Verify invitation status updated
      const [updated] = await db
        .select()
        .from(matchInvitations)
        .where(eq(matchInvitations.id, inv.id))
      expect(updated.status).toBe('accepted')
      expect(updated.respondedAt).not.toBeNull()
    })

    it('should decline without creating match', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const inv = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      expect('id' in inv).toBe(true)
      if (!('id' in inv)) return

      const result = await respondToInvitation(db, inv.id, receiver.id, false)

      expect('status' in result && !('error' in result)).toBe(true)
      if ('status' in result && !('error' in result)) {
        expect(result.status).toBe('declined')
        expect(result.matchId).toBeUndefined()
      }

      // No match created
      const allMatches = await db.select().from(matches)
      expect(allMatches).toHaveLength(0)
    })

    it('should reject if not the receiver', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const inv = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      expect('id' in inv).toBe(true)
      if (!('id' in inv)) return

      // Sender tries to respond
      const result = await respondToInvitation(db, inv.id, sender.id, true)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Not authorized to respond to this invitation')
      }
    })

    it('should reject response to non-pending invitation', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const inv = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      expect('id' in inv).toBe(true)
      if (!('id' in inv)) return

      // Accept first
      await respondToInvitation(db, inv.id, receiver.id, true)

      // Try to respond again
      const result = await respondToInvitation(db, inv.id, receiver.id, false)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Invitation is no longer pending')
      }
    })

    it('should reject response to non-existent invitation', async () => {
      const result = await respondToInvitation(
        db,
        '00000000-0000-0000-0000-000000000000',
        'user-1',
        true
      )

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Invitation not found')
      }
    })
  })

  describe('cancelInvitation', () => {
    it('should cancel pending invitation by sender', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const inv = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      expect('id' in inv).toBe(true)
      if (!('id' in inv)) return

      const result = await cancelInvitation(db, inv.id, sender.id)
      expect(result.success).toBe(true)

      const [updated] = await db
        .select()
        .from(matchInvitations)
        .where(eq(matchInvitations.id, inv.id))
      expect(updated.status).toBe('cancelled')
    })

    it('should reject cancel by receiver', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const inv = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      expect('id' in inv).toBe(true)
      if (!('id' in inv)) return

      const result = await cancelInvitation(db, inv.id, receiver.id)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Only the sender can cancel an invitation')
    })

    it('should reject cancel of non-pending invitation', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const inv = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      expect('id' in inv).toBe(true)
      if (!('id' in inv)) return

      // Accept first
      await respondToInvitation(db, inv.id, receiver.id, true)

      // Try to cancel accepted invitation
      const result = await cancelInvitation(db, inv.id, sender.id)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Only pending invitations can be cancelled')
    })
  })

  describe('getInvitations', () => {
    it('should return received invitations', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      const invitations = await getInvitations(db, receiver.id, 'received')
      expect(invitations).toHaveLength(1)
      expect(invitations[0].sender.id).toBe(sender.id)
      expect(invitations[0].receiver.id).toBe(receiver.id)
      expect(invitations[0].venue.name).toBe('Weghuberpark')
      expect(invitations[0].status).toBe('pending')
    })

    it('should return sent invitations', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      const invitations = await getInvitations(db, sender.id, 'sent')
      expect(invitations).toHaveLength(1)
      expect(invitations[0].sender.id).toBe(sender.id)
    })

    it('should not return other users invitations', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const thirdUser = await testFactories.createUser(db, { name: 'Third' })
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      const invitations = await getInvitations(db, thirdUser.id, 'received')
      expect(invitations).toHaveLength(0)
    })
  })

  describe('getPendingInvitationCount', () => {
    it('should count pending received invitations', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const sender2 = await testFactories.createUser(db, { name: 'Sender2' })
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      // Two pending invitations to receiver
      await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      await sendInvitation(db, {
        senderId: sender2.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      const count = await getPendingInvitationCount(db, receiver.id)
      expect(count).toBe(2)
    })

    it('should not count accepted/declined invitations', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const sender2 = await testFactories.createUser(db, { name: 'Sender2' })
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      // One pending, one accepted
      const inv1 = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      await sendInvitation(db, {
        senderId: sender2.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      if ('id' in inv1) {
        await respondToInvitation(db, inv1.id, receiver.id, true)
      }

      const count = await getPendingInvitationCount(db, receiver.id)
      expect(count).toBe(1)
    })

    it('should return 0 for sender (sent invitations dont count)', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })

      const count = await getPendingInvitationCount(db, sender.id)
      expect(count).toBe(0)
    })
  })

  describe('Full Flow', () => {
    it('send → accept → match created → verify all state', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      // 1. Send
      const inv = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
        message: 'Game on!',
      })
      expect('id' in inv).toBe(true)
      if (!('id' in inv)) return

      // 2. Verify pending count
      const pendingCount = await getPendingInvitationCount(db, receiver.id)
      expect(pendingCount).toBe(1)

      // 3. Accept
      const response = await respondToInvitation(db, inv.id, receiver.id, true)
      expect('matchId' in response).toBe(true)

      // 4. Verify invitation is accepted
      const [updatedInv] = await db
        .select()
        .from(matchInvitations)
        .where(eq(matchInvitations.id, inv.id))
      expect(updatedInv.status).toBe('accepted')

      // 5. Verify match is scheduled
      if ('matchId' in response && response.matchId) {
        const [match] = await db
          .select()
          .from(matches)
          .where(eq(matches.id, response.matchId))
        expect(match.status).toBe('scheduled')
        expect(match.invitationId).toBe(inv.id)
      }

      // 6. Pending count should now be 0
      const afterCount = await getPendingInvitationCount(db, receiver.id)
      expect(afterCount).toBe(0)
    })

    it('send → decline → no match → can re-invite', async () => {
      const { sender, receiver, venue, sport } = await createTestData()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      // 1. Send and decline
      const inv = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: tomorrow,
      })
      expect('id' in inv).toBe(true)
      if (!('id' in inv)) return

      await respondToInvitation(db, inv.id, receiver.id, false)

      // 2. No match created
      const allMatches = await db.select().from(matches)
      expect(allMatches).toHaveLength(0)

      // 3. Can send new invitation
      const inv2 = await sendInvitation(db, {
        senderId: sender.id,
        receiverId: receiver.id,
        venueId: venue.id,
        sportId: sport.id,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      })
      expect('id' in inv2).toBe(true)
    })
  })
})
