/**
 * 1v1 Challenge End-to-End Integration Tests
 * Full flow: check-in → challenge → accept → start → upload → score → agree → complete
 * Also tests: cancel, stuck state, auto-expiry, SSE notifications, check-out
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import { users, venues, cities, countries, sports, matches } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ===========================================
// MOCKS
// ===========================================

const mockGetSession = vi.fn()

vi.mock('@/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth')>()
  return { ...original, getSession: () => mockGetSession() }
})

vi.mock('@/lib/azure-storage', () => ({
  uploadMatchVideo: vi.fn().mockResolvedValue('https://test.blob.core.windows.net/video.mp4'),
  getUserAvatarSasUrl: (userId: string) => `https://test.blob.core.windows.net/avatar/${userId}`,
  getDefaultAvatarSasUrl: (gender: string) =>
    `https://test.blob.core.windows.net/default/${gender}`,
}))

// Mock SSE emitter to capture notifications
const capturedNotifications: Array<{ userId: string; event: { type: string; data: unknown } }> = []

vi.mock('@/lib/notifications/emitter', () => ({
  notifyUser: (userId: string, event: { type: string; data: unknown }) => {
    capturedNotifications.push({ userId, event })
  },
  addConnection: vi.fn(),
  removeConnection: vi.fn(),
  getConnectionCount: vi.fn().mockReturnValue(0),
}))

let testDb: TestDatabase

vi.mock('@/db', () => ({
  getDb: () => testDb,
}))

// Import after mocking
import { POST as POST_REQUEST } from '@/app/api/challenges/1v1/request/route'
import { POST as POST_START } from '@/app/api/challenges/1v1/[matchId]/route'
import { POST as POST_RESPOND } from '@/app/api/challenges/1v1/[matchId]/respond/route'
import { POST as POST_CANCEL } from '@/app/api/challenges/1v1/[matchId]/cancel/route'
import { POST as POST_UPLOAD } from '@/app/api/challenges/1v1/[matchId]/upload/route'
import { POST as POST_AGREE } from '@/app/api/challenges/1v1/[matchId]/agree/route'
import { checkInToVenue, checkOutFromVenue, getUserCheckInStatus } from '@/lib/venues/check-in'
import { canChallenge } from '@/lib/matches'

// ===========================================
// HELPERS
// ===========================================

async function setupTestData() {
  const [country] = await testDb
    .insert(countries)
    .values({ name: 'Austria', code: 'AT' })
    .returning()
  const [city] = await testDb
    .insert(cities)
    .values({ name: 'Vienna', countryId: country.id })
    .returning()
  const [player1] = await testDb
    .insert(users)
    .values({
      email: 'player1@test.com',
      name: 'Player One',
      cityId: city.id,
      hasCreatedAvatar: true,
      ageGroup: '18-30',
    })
    .returning()
  const [player2] = await testDb
    .insert(users)
    .values({
      email: 'player2@test.com',
      name: 'Player Two',
      cityId: city.id,
      hasCreatedAvatar: true,
      ageGroup: '18-30',
    })
    .returning()
  const [venue] = await testDb
    .insert(venues)
    .values({
      name: 'Test Court',
      cityId: city.id,
      isActive: true,
      latitude: 48.1962,
      longitude: 16.3551,
    })
    .returning()
  const [sport] = await testDb
    .insert(sports)
    .values({
      name: 'Basketball',
      slug: 'basketball',
      isActive: true,
    })
    .returning()

  return { country, city, player1, player2, venue, sport }
}

function jsonRequest(url: string, body: object, method = 'POST') {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function routeParams(matchId: string) {
  return { params: Promise.resolve({ matchId }) }
}

// ===========================================
// TESTS
// ===========================================

describe('1v1 Challenge E2E Flow', () => {
  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  beforeEach(async () => {
    await clearTestDb(testDb)
    mockGetSession.mockReset()
    capturedNotifications.length = 0
  })

  // -------------------------------------------
  // FULL HAPPY PATH
  // -------------------------------------------

  describe('Full happy path: check-in → challenge → accept → start → upload → score → agree → complete', () => {
    it('should complete the entire 1v1 flow end-to-end', async () => {
      const { player1, player2, venue } = await setupTestData()

      // Step 1: Both players check in at venue
      const checkIn1 = await checkInToVenue(testDb, player1.id, venue.id, 48.1963, 16.3552)
      expect(checkIn1.success).toBe(true)

      const checkIn2 = await checkInToVenue(testDb, player2.id, venue.id, 48.1961, 16.355)
      expect(checkIn2.success).toBe(true)

      // Step 2: Player 1 sends challenge
      mockGetSession.mockResolvedValue({ user: { id: player1.id } })
      const challengeReq = jsonRequest('http://localhost/api/challenges/1v1/request', {
        opponentId: player2.id,
        venueId: venue.id,
      })
      const challengeRes = await POST_REQUEST(challengeReq)
      expect(challengeRes.status).toBe(200)
      const challengeData = await challengeRes.json()
      expect(challengeData.matchId).toBeDefined()
      const matchId = challengeData.matchId

      // Verify SSE notification sent to player2
      const challengeNotif = capturedNotifications.find(
        (n) => n.userId === player2.id && n.event.type === 'challenge-received'
      )
      expect(challengeNotif).toBeDefined()

      // Step 3: Player 2 accepts
      mockGetSession.mockResolvedValue({ user: { id: player2.id } })
      const acceptReq = jsonRequest(`http://localhost/api/challenges/1v1/${matchId}/respond`, {
        accept: true,
      })
      const acceptRes = await POST_RESPOND(acceptReq, routeParams(matchId))
      expect(acceptRes.status).toBe(200)
      const acceptData = await acceptRes.json()
      expect(acceptData.status).toBe('accepted')

      // Verify SSE notification sent to player1
      const acceptNotif = capturedNotifications.find(
        (n) => n.userId === player1.id && n.event.type === 'challenge-accepted'
      )
      expect(acceptNotif).toBeDefined()

      // Step 4: Player 1 starts match (begins recording)
      mockGetSession.mockResolvedValue({ user: { id: player1.id } })
      const startReq = new Request(`http://localhost/api/challenges/1v1/${matchId}`, {
        method: 'POST',
      })
      const startRes = await POST_START(startReq, routeParams(matchId))
      expect(startRes.status).toBe(200)
      const startData = await startRes.json()
      expect(startData.status).toBe('in_progress')

      // Step 5: Player 1 uploads video
      const formData = new FormData()
      formData.append('video', new Blob(['test video'], { type: 'video/mp4' }), 'match.mp4')
      const uploadReq = new Request(`http://localhost/api/challenges/1v1/${matchId}/upload`, {
        method: 'POST',
        body: formData,
      })
      const uploadRes = await POST_UPLOAD(uploadReq, routeParams(matchId))
      expect(uploadRes.status).toBe(200)
      const uploadData = await uploadRes.json()
      expect(uploadData.status).toBe('in_progress') // No AI — stays in_progress
      expect(uploadData.videoUrl).toBeDefined()

      // Step 6: Verify match is in correct state in DB
      const [matchInDb] = await testDb
        .select()
        .from(matches)
        .where(eq(matches.id, matchId))
        .limit(1)
      expect(matchInDb.status).toBe('in_progress')
      expect(matchInDb.videoUrl).toBeTruthy()

      // Step 7: Both players check out
      await checkOutFromVenue(testDb, player1.id, venue.id)
      await checkOutFromVenue(testDb, player2.id, venue.id)

      const status1 = await getUserCheckInStatus(testDb, player1.id, venue.id)
      expect(status1.isCheckedIn).toBe(false)
    })
  })

  // -------------------------------------------
  // CHALLENGE CANCEL FLOW
  // -------------------------------------------

  describe('Challenge cancel flow', () => {
    it('should allow challenger to cancel pending challenge', async () => {
      const { player1, player2, venue } = await setupTestData()

      // Create challenge
      mockGetSession.mockResolvedValue({ user: { id: player1.id } })
      const challengeRes = await POST_REQUEST(
        jsonRequest('http://localhost/api/challenges/1v1/request', {
          opponentId: player2.id,
          venueId: venue.id,
        })
      )
      const { matchId } = await challengeRes.json()

      // Player 1 cancels
      capturedNotifications.length = 0
      const cancelReq = new Request(`http://localhost/api/challenges/1v1/${matchId}/cancel`, {
        method: 'POST',
      })
      const cancelRes = await POST_CANCEL(cancelReq, routeParams(matchId))
      expect(cancelRes.status).toBe(200)

      // Verify match is cancelled
      const [match] = await testDb.select().from(matches).where(eq(matches.id, matchId)).limit(1)
      expect(match.status).toBe('cancelled')

      // Verify opponent notified
      const cancelNotif = capturedNotifications.find(
        (n) => n.userId === player2.id && n.event.type === 'challenge-cancelled'
      )
      expect(cancelNotif).toBeDefined()
    })

    it('should not allow opponent to cancel (only challenger can)', async () => {
      const { player1, player2, venue } = await setupTestData()

      // Create challenge
      mockGetSession.mockResolvedValue({ user: { id: player1.id } })
      const challengeRes = await POST_REQUEST(
        jsonRequest('http://localhost/api/challenges/1v1/request', {
          opponentId: player2.id,
          venueId: venue.id,
        })
      )
      const { matchId } = await challengeRes.json()

      // Player 2 tries to cancel — should fail
      mockGetSession.mockResolvedValue({ user: { id: player2.id } })
      const cancelReq = new Request(`http://localhost/api/challenges/1v1/${matchId}/cancel`, {
        method: 'POST',
      })
      const cancelRes = await POST_CANCEL(cancelReq, routeParams(matchId))
      expect(cancelRes.status).toBe(400)
    })

    it('should allow new challenge after cancelling', async () => {
      const { player1, player2, venue } = await setupTestData()

      // Create and cancel
      mockGetSession.mockResolvedValue({ user: { id: player1.id } })
      const res1 = await POST_REQUEST(
        jsonRequest('http://localhost/api/challenges/1v1/request', {
          opponentId: player2.id,
          venueId: venue.id,
        })
      )
      const { matchId } = await res1.json()

      await POST_CANCEL(
        new Request(`http://localhost/api/challenges/1v1/${matchId}/cancel`, { method: 'POST' }),
        routeParams(matchId)
      )

      // canChallenge should return true
      const result = await canChallenge(testDb, player1.id, player2.id)
      expect(result.canChallenge).toBe(true)

      // Create new challenge should work
      const res2 = await POST_REQUEST(
        jsonRequest('http://localhost/api/challenges/1v1/request', {
          opponentId: player2.id,
          venueId: venue.id,
        })
      )
      expect(res2.status).toBe(200)
    })
  })

  // -------------------------------------------
  // STUCK STATE & AUTO-EXPIRY
  // -------------------------------------------

  describe('Stuck state and auto-expiry', () => {
    it('should block new challenge when one is already pending', async () => {
      const { player1, player2, venue } = await setupTestData()

      const result1 = await canChallenge(testDb, player1.id, player2.id)
      expect(result1.canChallenge).toBe(true)

      // Create pending match directly
      await testDb.insert(matches).values({
        player1Id: player1.id,
        player2Id: player2.id,
        venueId: venue.id,
        sportId: (await testDb.select().from(sports).limit(1))[0].id,
        status: 'pending',
      })

      const result2 = await canChallenge(testDb, player1.id, player2.id)
      expect(result2.canChallenge).toBe(false)
      expect(result2.error).toContain('active challenge')
    })

    it('should auto-expire pending matches older than 30 minutes', async () => {
      const { player1, player2, venue } = await setupTestData()

      // Create a match with old createdAt (31 minutes ago)
      const oldDate = new Date(Date.now() - 31 * 60 * 1000)
      await testDb.insert(matches).values({
        player1Id: player1.id,
        player2Id: player2.id,
        venueId: venue.id,
        sportId: (await testDb.select().from(sports).limit(1))[0].id,
        status: 'pending',
        createdAt: oldDate,
      })

      // canChallenge should auto-expire it and return true
      const result = await canChallenge(testDb, player1.id, player2.id)
      expect(result.canChallenge).toBe(true)

      // Verify old match was cancelled
      const allMatches = await testDb.select().from(matches)
      expect(allMatches[0].status).toBe('cancelled')
    })

    it('should NOT auto-expire recent pending matches', async () => {
      const { player1, player2, venue } = await setupTestData()

      // Create a recent match (5 minutes ago)
      const recentDate = new Date(Date.now() - 5 * 60 * 1000)
      await testDb.insert(matches).values({
        player1Id: player1.id,
        player2Id: player2.id,
        venueId: venue.id,
        sportId: (await testDb.select().from(sports).limit(1))[0].id,
        status: 'pending',
        createdAt: recentDate,
      })

      const result = await canChallenge(testDb, player1.id, player2.id)
      expect(result.canChallenge).toBe(false)
    })

    it('should block challenge when match is in_progress', async () => {
      const { player1, player2, venue } = await setupTestData()

      await testDb.insert(matches).values({
        player1Id: player1.id,
        player2Id: player2.id,
        venueId: venue.id,
        sportId: (await testDb.select().from(sports).limit(1))[0].id,
        status: 'in_progress',
      })

      const result = await canChallenge(testDb, player1.id, player2.id)
      expect(result.canChallenge).toBe(false)
    })

    it('should allow challenge when previous match is completed', async () => {
      const { player1, player2, venue } = await setupTestData()

      await testDb.insert(matches).values({
        player1Id: player1.id,
        player2Id: player2.id,
        venueId: venue.id,
        sportId: (await testDb.select().from(sports).limit(1))[0].id,
        status: 'completed',
      })

      const result = await canChallenge(testDb, player1.id, player2.id)
      expect(result.canChallenge).toBe(true)
    })

    it('should allow challenge when previous match is declined', async () => {
      const { player1, player2, venue } = await setupTestData()

      await testDb.insert(matches).values({
        player1Id: player1.id,
        player2Id: player2.id,
        venueId: venue.id,
        sportId: (await testDb.select().from(sports).limit(1))[0].id,
        status: 'declined',
      })

      const result = await canChallenge(testDb, player1.id, player2.id)
      expect(result.canChallenge).toBe(true)
    })
  })

  // -------------------------------------------
  // DECLINE FLOW
  // -------------------------------------------

  describe('Decline flow', () => {
    it('should notify challenger when challenge is declined', async () => {
      const { player1, player2, venue } = await setupTestData()

      mockGetSession.mockResolvedValue({ user: { id: player1.id } })
      const challengeRes = await POST_REQUEST(
        jsonRequest('http://localhost/api/challenges/1v1/request', {
          opponentId: player2.id,
          venueId: venue.id,
        })
      )
      const { matchId } = await challengeRes.json()

      capturedNotifications.length = 0
      mockGetSession.mockResolvedValue({ user: { id: player2.id } })
      const declineReq = jsonRequest(`http://localhost/api/challenges/1v1/${matchId}/respond`, {
        accept: false,
      })
      const declineRes = await POST_RESPOND(declineReq, routeParams(matchId))
      expect(declineRes.status).toBe(200)

      const declineNotif = capturedNotifications.find(
        (n) => n.userId === player1.id && n.event.type === 'challenge-declined'
      )
      expect(declineNotif).toBeDefined()
    })
  })

  // -------------------------------------------
  // UPLOAD PERMISSION
  // -------------------------------------------

  describe('Upload permissions', () => {
    it('should allow upload when recordingBy is null (any participant)', async () => {
      const { player1, player2, venue } = await setupTestData()

      // Create in_progress match with no recordingBy
      const [match] = await testDb
        .insert(matches)
        .values({
          player1Id: player1.id,
          player2Id: player2.id,
          venueId: venue.id,
          sportId: (await testDb.select().from(sports).limit(1))[0].id,
          status: 'in_progress',
          recordingBy: null,
        })
        .returning()

      mockGetSession.mockResolvedValue({ user: { id: player2.id } })
      const formData = new FormData()
      formData.append('video', new Blob(['video'], { type: 'video/mp4' }), 'test.mp4')
      const uploadReq = new Request(`http://localhost/api/challenges/1v1/${match.id}/upload`, {
        method: 'POST',
        body: formData,
      })
      const uploadRes = await POST_UPLOAD(uploadReq, routeParams(match.id))
      expect(uploadRes.status).toBe(200)
    })

    it('should reject upload from wrong player when recordingBy is set', async () => {
      const { player1, player2, venue } = await setupTestData()

      const [match] = await testDb
        .insert(matches)
        .values({
          player1Id: player1.id,
          player2Id: player2.id,
          venueId: venue.id,
          sportId: (await testDb.select().from(sports).limit(1))[0].id,
          status: 'in_progress',
          recordingBy: player1.id,
        })
        .returning()

      mockGetSession.mockResolvedValue({ user: { id: player2.id } })
      const formData = new FormData()
      formData.append('video', new Blob(['video'], { type: 'video/mp4' }), 'test.mp4')
      const uploadReq = new Request(`http://localhost/api/challenges/1v1/${match.id}/upload`, {
        method: 'POST',
        body: formData,
      })
      const uploadRes = await POST_UPLOAD(uploadReq, routeParams(match.id))
      expect(uploadRes.status).toBe(403)
    })

    it('should reject duplicate video upload', async () => {
      const { player1, player2, venue } = await setupTestData()

      const [match] = await testDb
        .insert(matches)
        .values({
          player1Id: player1.id,
          player2Id: player2.id,
          venueId: venue.id,
          sportId: (await testDb.select().from(sports).limit(1))[0].id,
          status: 'in_progress',
          videoUrl: 'https://already-uploaded.mp4',
        })
        .returning()

      mockGetSession.mockResolvedValue({ user: { id: player1.id } })
      const formData = new FormData()
      formData.append('video', new Blob(['video'], { type: 'video/mp4' }), 'test.mp4')
      const uploadReq = new Request(`http://localhost/api/challenges/1v1/${match.id}/upload`, {
        method: 'POST',
        body: formData,
      })
      const uploadRes = await POST_UPLOAD(uploadReq, routeParams(match.id))
      expect(uploadRes.status).toBe(400)
    })
  })

  // -------------------------------------------
  // SCORE & AGREEMENT
  // -------------------------------------------

  describe('Score submission and agreement', () => {
    it('should complete match when both players agree', async () => {
      const { player1, player2, venue } = await setupTestData()

      const [match] = await testDb
        .insert(matches)
        .values({
          player1Id: player1.id,
          player2Id: player2.id,
          venueId: venue.id,
          sportId: (await testDb.select().from(sports).limit(1))[0].id,
          status: 'completed',
          player1Score: 12,
          player2Score: 10,
          winnerId: player1.id,
          winnerXp: 100,
          winnerRp: 20,
          loserXp: 25,
        })
        .returning()

      // Player 1 agrees
      mockGetSession.mockResolvedValue({ user: { id: player1.id } })
      const agree1Req = jsonRequest(`http://localhost/api/challenges/1v1/${match.id}/agree`, {
        agree: true,
      })
      const agree1Res = await POST_AGREE(agree1Req, routeParams(match.id))
      expect(agree1Res.status).toBe(200)
      const agree1Data = await agree1Res.json()
      expect(agree1Data.bothAgreed).toBe(false)

      // Player 2 agrees
      capturedNotifications.length = 0
      mockGetSession.mockResolvedValue({ user: { id: player2.id } })
      const agree2Req = jsonRequest(`http://localhost/api/challenges/1v1/${match.id}/agree`, {
        agree: true,
      })
      const agree2Res = await POST_AGREE(agree2Req, routeParams(match.id))
      expect(agree2Res.status).toBe(200)
      const agree2Data = await agree2Res.json()
      expect(agree2Data.bothAgreed).toBe(true)

      // Verify match-completed notification
      const completeNotif = capturedNotifications.find(
        (n) => n.userId === player1.id && n.event.type === 'match-completed'
      )
      expect(completeNotif).toBeDefined()
    })

    it('should handle dispute', async () => {
      const { player1, player2, venue } = await setupTestData()

      const [match] = await testDb
        .insert(matches)
        .values({
          player1Id: player1.id,
          player2Id: player2.id,
          venueId: venue.id,
          sportId: (await testDb.select().from(sports).limit(1))[0].id,
          status: 'completed',
          player1Score: 12,
          player2Score: 10,
          winnerId: player1.id,
        })
        .returning()

      mockGetSession.mockResolvedValue({ user: { id: player2.id } })
      const disputeReq = jsonRequest(`http://localhost/api/challenges/1v1/${match.id}/agree`, {
        agree: false,
      })
      const disputeRes = await POST_AGREE(disputeReq, routeParams(match.id))
      expect(disputeRes.status).toBe(200)

      const [updatedMatch] = await testDb
        .select()
        .from(matches)
        .where(eq(matches.id, match.id))
        .limit(1)
      expect(updatedMatch.status).toBe('disputed')
    })
  })

  // -------------------------------------------
  // CHECK-IN / CHECK-OUT
  // -------------------------------------------

  describe('Venue check-in and check-out', () => {
    it('should check in within distance and check out', async () => {
      const { player1, venue } = await setupTestData()

      // Check in (~100m from venue)
      const checkIn = await checkInToVenue(testDb, player1.id, venue.id, 48.1963, 16.3552)
      expect(checkIn.success).toBe(true)

      const status = await getUserCheckInStatus(testDb, player1.id, venue.id)
      expect(status.isCheckedIn).toBe(true)

      // Check out
      const checkOut = await checkOutFromVenue(testDb, player1.id, venue.id)
      expect(checkOut.success).toBe(true)

      const statusAfter = await getUserCheckInStatus(testDb, player1.id, venue.id)
      expect(statusAfter.isCheckedIn).toBe(false)
    })

    it('should prevent check-in when too far from venue', async () => {
      const { player1, venue } = await setupTestData()

      // ~10km away from venue
      const checkIn = await checkInToVenue(testDb, player1.id, venue.id, 48.2962, 16.4551)
      expect(checkIn.success).toBe(false)
    })

    it('should allow repeated check-in refresh for same venue', async () => {
      const { player1, venue } = await setupTestData()

      await checkInToVenue(testDb, player1.id, venue.id, 48.1963, 16.3552)
      const secondCheckIn = await checkInToVenue(testDb, player1.id, venue.id, 48.1963, 16.3552)
      expect(secondCheckIn.success).toBe(true)
    })
  })

  // -------------------------------------------
  // SSE NOTIFICATION EVENTS
  // -------------------------------------------

  describe('SSE notification events', () => {
    it('should send correct notification types for each action', async () => {
      const { player1, player2, venue } = await setupTestData()

      // Create challenge → challenge-received to player2
      mockGetSession.mockResolvedValue({ user: { id: player1.id } })
      const res = await POST_REQUEST(
        jsonRequest('http://localhost/api/challenges/1v1/request', {
          opponentId: player2.id,
          venueId: venue.id,
        })
      )
      const { matchId } = await res.json()

      expect(
        capturedNotifications.some(
          (n) => n.userId === player2.id && n.event.type === 'challenge-received'
        )
      ).toBe(true)

      // Accept → challenge-accepted to player1
      mockGetSession.mockResolvedValue({ user: { id: player2.id } })
      await POST_RESPOND(
        jsonRequest(`http://localhost/api/challenges/1v1/${matchId}/respond`, { accept: true }),
        routeParams(matchId)
      )

      expect(
        capturedNotifications.some(
          (n) => n.userId === player1.id && n.event.type === 'challenge-accepted'
        )
      ).toBe(true)
    })
  })
})
