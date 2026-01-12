import { describe, it, expect } from 'vitest'
import {
  canUnlockItem,
  canPurchaseItem,
  getUnlockProgress,
  formatRequirement,
} from '@/lib/avatar/unlock'

interface MockPlayerStats {
  id: string
  userId: string
  sportId: string
  totalXp: number
  totalRp: number
  availableRp: number
  matchesPlayed: number
  matchesWon: number
  matchesLost: number
  challengesCompleted: number
  totalPointsScored: number
  threePointMade: number
  threePointAttempted: number
  freeThrowMade: number
  freeThrowAttempted: number
  usersInvited: number
  updatedAt: Date | null
}

interface MockAvatarItem {
  id: string
  name: string
  itemType: string
  sportId: string | null
  imageUrl: string | null
  requiredMatches: number | null
  requiredChallenges: number | null
  requiredInvites: number | null
  requiredXp: number | null
  rpCost: number | null
  isDefault: boolean
  isActive: boolean
  createdAt: Date
}

// Helper to create mock player stats
function createMockStats(overrides: Partial<MockPlayerStats> = {}): MockPlayerStats {
  return {
    id: 'stats-1',
    userId: 'user-1',
    sportId: 'sport-1',
    totalXp: 0,
    totalRp: 0,
    availableRp: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    challengesCompleted: 0,
    totalPointsScored: 0,
    threePointMade: 0,
    threePointAttempted: 0,
    freeThrowMade: 0,
    freeThrowAttempted: 0,
    usersInvited: 0,
    updatedAt: null,
    ...overrides,
  }
}

// Helper to create mock avatar item
function createMockItem(overrides: Partial<MockAvatarItem> = {}): MockAvatarItem {
  return {
    id: 'item-1',
    name: 'Test Item',
    itemType: 'jersey',
    sportId: null,
    imageUrl: null,
    requiredMatches: null,
    requiredChallenges: null,
    requiredInvites: null,
    requiredXp: null,
    rpCost: null,
    isDefault: false,
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('canUnlockItem', () => {
  it('returns true for default items', () => {
    const stats = createMockStats()
    const item = createMockItem({ isDefault: true })
    expect(canUnlockItem(stats, item)).toBe(true)
  })

  it('returns true when no requirements are set', () => {
    const stats = createMockStats()
    const item = createMockItem()
    expect(canUnlockItem(stats, item)).toBe(true)
  })

  it('returns true when matches requirement is met', () => {
    const stats = createMockStats({ matchesPlayed: 10 })
    const item = createMockItem({ requiredMatches: 10 })
    expect(canUnlockItem(stats, item)).toBe(true)
  })

  it('returns false when matches requirement is not met', () => {
    const stats = createMockStats({ matchesPlayed: 5 })
    const item = createMockItem({ requiredMatches: 10 })
    expect(canUnlockItem(stats, item)).toBe(false)
  })

  it('returns true when challenges requirement is met', () => {
    const stats = createMockStats({ challengesCompleted: 13 })
    const item = createMockItem({ requiredChallenges: 13 })
    expect(canUnlockItem(stats, item)).toBe(true)
  })

  it('returns false when challenges requirement is not met', () => {
    const stats = createMockStats({ challengesCompleted: 5 })
    const item = createMockItem({ requiredChallenges: 13 })
    expect(canUnlockItem(stats, item)).toBe(false)
  })

  it('returns true when invites requirement is met', () => {
    const stats = createMockStats({ usersInvited: 3 })
    const item = createMockItem({ requiredInvites: 3 })
    expect(canUnlockItem(stats, item)).toBe(true)
  })

  it('returns false when invites requirement is not met', () => {
    const stats = createMockStats({ usersInvited: 1 })
    const item = createMockItem({ requiredInvites: 3 })
    expect(canUnlockItem(stats, item)).toBe(false)
  })

  it('returns true when XP requirement is met', () => {
    const stats = createMockStats({ totalXp: 5000 })
    const item = createMockItem({ requiredXp: 5000 })
    expect(canUnlockItem(stats, item)).toBe(true)
  })

  it('returns false when XP requirement is not met', () => {
    const stats = createMockStats({ totalXp: 3000 })
    const item = createMockItem({ requiredXp: 5000 })
    expect(canUnlockItem(stats, item)).toBe(false)
  })

  it('returns true when ALL multiple requirements are met', () => {
    const stats = createMockStats({
      matchesPlayed: 25,
      challengesCompleted: 10,
      totalXp: 5000,
    })
    const item = createMockItem({
      requiredMatches: 25,
      requiredChallenges: 10,
      requiredXp: 5000,
    })
    expect(canUnlockItem(stats, item)).toBe(true)
  })

  it('returns false when one of multiple requirements is not met', () => {
    const stats = createMockStats({
      matchesPlayed: 25,
      challengesCompleted: 5, // Not enough
      totalXp: 5000,
    })
    const item = createMockItem({
      requiredMatches: 25,
      requiredChallenges: 10,
      requiredXp: 5000,
    })
    expect(canUnlockItem(stats, item)).toBe(false)
  })
})

describe('canPurchaseItem', () => {
  it('returns false when item has no rpCost', () => {
    const stats = createMockStats({ availableRp: 100 })
    const item = createMockItem({ rpCost: null })
    expect(canPurchaseItem(stats, item)).toBe(false)
  })

  it('returns true when user has enough RP', () => {
    const stats = createMockStats({ availableRp: 100 })
    const item = createMockItem({ rpCost: 50 })
    expect(canPurchaseItem(stats, item)).toBe(true)
  })

  it('returns true when user has exactly enough RP', () => {
    const stats = createMockStats({ availableRp: 50 })
    const item = createMockItem({ rpCost: 50 })
    expect(canPurchaseItem(stats, item)).toBe(true)
  })

  it('returns false when user has insufficient RP', () => {
    const stats = createMockStats({ availableRp: 30 })
    const item = createMockItem({ rpCost: 50 })
    expect(canPurchaseItem(stats, item)).toBe(false)
  })

  it('returns false when user has zero RP', () => {
    const stats = createMockStats({ availableRp: 0 })
    const item = createMockItem({ rpCost: 50 })
    expect(canPurchaseItem(stats, item)).toBe(false)
  })
})

describe('getUnlockProgress', () => {
  it('returns null for all fields when no requirements', () => {
    const stats = createMockStats()
    const item = createMockItem()
    const progress = getUnlockProgress(stats, item)

    expect(progress.matches).toBeNull()
    expect(progress.challenges).toBeNull()
    expect(progress.invites).toBeNull()
    expect(progress.xp).toBeNull()
  })

  it('returns matches progress when required', () => {
    const stats = createMockStats({ matchesPlayed: 5 })
    const item = createMockItem({ requiredMatches: 10 })
    const progress = getUnlockProgress(stats, item)

    expect(progress.matches).toEqual({ current: 5, required: 10 })
    expect(progress.challenges).toBeNull()
  })

  it('returns challenges progress when required', () => {
    const stats = createMockStats({ challengesCompleted: 8 })
    const item = createMockItem({ requiredChallenges: 13 })
    const progress = getUnlockProgress(stats, item)

    expect(progress.challenges).toEqual({ current: 8, required: 13 })
  })

  it('returns invites progress when required', () => {
    const stats = createMockStats({ usersInvited: 2 })
    const item = createMockItem({ requiredInvites: 5 })
    const progress = getUnlockProgress(stats, item)

    expect(progress.invites).toEqual({ current: 2, required: 5 })
  })

  it('returns XP progress when required', () => {
    const stats = createMockStats({ totalXp: 3000 })
    const item = createMockItem({ requiredXp: 5000 })
    const progress = getUnlockProgress(stats, item)

    expect(progress.xp).toEqual({ current: 3000, required: 5000 })
  })

  it('returns all progress fields when all requirements set', () => {
    const stats = createMockStats({
      matchesPlayed: 15,
      challengesCompleted: 10,
      usersInvited: 2,
      totalXp: 4000,
    })
    const item = createMockItem({
      requiredMatches: 25,
      requiredChallenges: 13,
      requiredInvites: 3,
      requiredXp: 5000,
    })
    const progress = getUnlockProgress(stats, item)

    expect(progress.matches).toEqual({ current: 15, required: 25 })
    expect(progress.challenges).toEqual({ current: 10, required: 13 })
    expect(progress.invites).toEqual({ current: 2, required: 3 })
    expect(progress.xp).toEqual({ current: 4000, required: 5000 })
  })
})

describe('formatRequirement', () => {
  it('returns "Default item" for items with no requirements', () => {
    const item = createMockItem({ isDefault: true })
    expect(formatRequirement(item)).toBe('Default item')
  })

  it('returns RP cost when only rpCost is set', () => {
    const item = createMockItem({ rpCost: 50 })
    expect(formatRequirement(item)).toBe('50 RP')
  })

  it('formats matches requirement', () => {
    const item = createMockItem({ requiredMatches: 10 })
    expect(formatRequirement(item)).toBe('10 matches')
  })

  it('formats challenges requirement', () => {
    const item = createMockItem({ requiredChallenges: 13 })
    expect(formatRequirement(item)).toBe('13 challenges')
  })

  it('formats invites requirement', () => {
    const item = createMockItem({ requiredInvites: 3 })
    expect(formatRequirement(item)).toBe('3 invites')
  })

  it('formats XP requirement', () => {
    const item = createMockItem({ requiredXp: 5000 })
    expect(formatRequirement(item)).toBe('5000 XP')
  })

  it('formats multiple requirements with " + " separator', () => {
    const item = createMockItem({
      requiredMatches: 25,
      requiredChallenges: 13,
    })
    expect(formatRequirement(item)).toBe('25 matches + 13 challenges')
  })

  it('formats all requirements together', () => {
    const item = createMockItem({
      requiredMatches: 25,
      requiredChallenges: 13,
      requiredInvites: 3,
      requiredXp: 5000,
    })
    expect(formatRequirement(item)).toBe('25 matches + 13 challenges + 3 invites + 5000 XP')
  })
})
