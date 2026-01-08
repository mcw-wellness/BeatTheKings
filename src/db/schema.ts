import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ===========================================
// LOCATION TABLES
// Hierarchy: Country → City → Venue (3 tiers)
// Rankings: Venue → City → Country
// ===========================================

export const countries = pgTable('Country', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(), // "Austria"
  code: varchar('code', { length: 10 }).notNull().unique(), // "AT" (ISO 3166-1 alpha-2)
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const countriesRelations = relations(countries, ({ many }) => ({
  cities: many(cities),
}))

export const cities = pgTable(
  'City',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(), // "Vienna"
    countryId: uuid('countryId')
      .notNull()
      .references(() => countries.id),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => [
    unique('City_name_countryId_key').on(table.name, table.countryId),
    index('City_countryId_idx').on(table.countryId),
  ]
)

export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, {
    fields: [cities.countryId],
    references: [countries.id],
  }),
  venues: many(venues),
  users: many(users),
}))

// ===========================================
// USER TABLE
// OAuth-based authentication (Google/Microsoft)
// ===========================================

export const users = pgTable(
  'User',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(), // From OAuth provider

    // Profile (filled during avatar creation)
    name: varchar('name', { length: 255 }),
    dateOfBirth: date('dateOfBirth'),
    ageGroup: varchar('ageGroup', { length: 50 }), // "Under-18", "18-30", "31+"
    gender: varchar('gender', { length: 50 }), // "Male", "Female", "Other"

    // Location
    cityId: uuid('cityId').references(() => cities.id),

    // Status
    hasCreatedAvatar: boolean('hasCreatedAvatar').default(false).notNull(),

    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt'), // Nullable - set on update, not on create
  },
  (table) => [
    index('User_email_idx').on(table.email),
    index('User_ageGroup_idx').on(table.ageGroup),
    index('User_cityId_idx').on(table.cityId),
  ]
)

export const usersRelations = relations(users, ({ one, many }) => ({
  city: one(cities, {
    fields: [users.cityId],
    references: [cities.id],
  }),
  avatar: one(avatars),
  unlockedItems: many(userUnlockedItems),
  playerStats: many(playerStats),
  challengeAttempts: many(challengeAttempts),
  matchesAsPlayer1: many(matches, { relationName: 'player1' }),
  matchesAsPlayer2: many(matches, { relationName: 'player2' }),
  matchesWon: many(matches, { relationName: 'winner' }),
  activeSessions: many(activePlayers),
}))

// ===========================================
// SPORT & VENUE TABLES
// ===========================================

export const sports = pgTable('Sport', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(), // "Basketball"
  slug: varchar('slug', { length: 255 }).notNull().unique(), // "basketball"
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const sportsRelations = relations(sports, ({ many }) => ({
  avatarItems: many(avatarItems),
  avatarEquipments: many(avatarEquipments),
  challenges: many(challenges),
  matches: many(matches),
  playerStats: many(playerStats),
}))

export const venues = pgTable(
  'Venue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(), // "Esterhazy Park"
    cityId: uuid('cityId')
      .notNull()
      .references(() => cities.id),

    // Location
    address: varchar('address', { length: 500 }),
    district: varchar('district', { length: 255 }), // Optional text field: "6. Bezirk", "Downtown", etc.
    latitude: doublePrecision('latitude'), // For distance calculation and sorting by proximity
    longitude: doublePrecision('longitude'), // For distance calculation and sorting by proximity

    // Meta
    description: text('description'),
    imageUrl: varchar('imageUrl', { length: 500 }), // Venue photo displayed in UI
    isActive: boolean('isActive').default(true).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt'), // Nullable - set on update, not on create
  },
  (table) => [
    index('Venue_latLong_idx').on(table.latitude, table.longitude),
    index('Venue_cityId_idx').on(table.cityId),
  ]
)

export const venuesRelations = relations(venues, ({ one, many }) => ({
  city: one(cities, {
    fields: [venues.cityId],
    references: [cities.id],
  }),
  challenges: many(challenges),
  matches: many(matches),
  activePlayers: many(activePlayers),
}))

// ===========================================
// AVATAR TABLES
// ===========================================

export const avatarItems = pgTable(
  'AvatarItem',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(), // "Red Jersey"
    itemType: varchar('itemType', { length: 50 }).notNull(), // "hair", "jersey", "shorts", "shoes", "accessory"
    sportId: uuid('sportId').references(() => sports.id), // null = universal (works for all sports)
    imageUrl: varchar('imageUrl', { length: 500 }), // Nullable for default items

    // Unlock requirements (all nullable - if all null, item is free/default)
    requiredMatches: integer('requiredMatches'),
    requiredChallenges: integer('requiredChallenges'),
    requiredInvites: integer('requiredInvites'),
    requiredXp: integer('requiredXp'),
    rpCost: integer('rpCost'), // Can buy with RP as alternative

    isDefault: boolean('isDefault').default(false).notNull(), // Starter items
    isActive: boolean('isActive').default(true).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => [
    index('AvatarItem_sportId_idx').on(table.sportId),
    index('AvatarItem_itemType_idx').on(table.itemType),
  ]
)

export const avatarItemsRelations = relations(avatarItems, ({ one, many }) => ({
  sport: one(sports, {
    fields: [avatarItems.sportId],
    references: [sports.id],
  }),
  unlockedBy: many(userUnlockedItems),
  equippedAsJersey: many(avatarEquipments, { relationName: 'jerseyItem' }),
  equippedAsShorts: many(avatarEquipments, { relationName: 'shortsItem' }),
  equippedAsShoes: many(avatarEquipments, { relationName: 'shoesItem' }),
  equippedAsAccessory: many(avatarEquipments, { relationName: 'accessoryItem' }),
}))

export const avatars = pgTable('Avatar', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .unique()
    .references(() => users.id),

  // Base appearance (not sport-specific)
  skinTone: varchar('skinTone', { length: 50 }),
  hairStyle: varchar('hairStyle', { length: 50 }),
  hairColor: varchar('hairColor', { length: 50 }),

  // AI-generated avatar image URL (Azure Blob Storage)
  imageUrl: varchar('imageUrl', { length: 500 }),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt'), // Nullable - set on update, not on create
})

export const avatarsRelations = relations(avatars, ({ one, many }) => ({
  user: one(users, {
    fields: [avatars.userId],
    references: [users.id],
  }),
  equipments: many(avatarEquipments),
}))

export const userUnlockedItems = pgTable(
  'UserUnlockedItem',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id),
    itemId: uuid('itemId')
      .notNull()
      .references(() => avatarItems.id),
    unlockedAt: timestamp('unlockedAt').defaultNow().notNull(),
    unlockedVia: varchar('unlockedVia', { length: 50 }).notNull(), // "achievement", "purchase", "default"
  },
  (table) => [
    unique('UserUnlockedItem_userId_itemId_key').on(table.userId, table.itemId),
    index('UserUnlockedItem_userId_idx').on(table.userId),
  ]
)

export const userUnlockedItemsRelations = relations(userUnlockedItems, ({ one }) => ({
  user: one(users, {
    fields: [userUnlockedItems.userId],
    references: [users.id],
  }),
  item: one(avatarItems, {
    fields: [userUnlockedItems.itemId],
    references: [avatarItems.id],
  }),
}))

export const avatarEquipments = pgTable(
  'AvatarEquipment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    avatarId: uuid('avatarId')
      .notNull()
      .references(() => avatars.id),
    sportId: uuid('sportId')
      .notNull()
      .references(() => sports.id),

    // Equipped items per slot
    jerseyItemId: uuid('jerseyItemId').references(() => avatarItems.id),
    shortsItemId: uuid('shortsItemId').references(() => avatarItems.id),
    shoesItemId: uuid('shoesItemId').references(() => avatarItems.id),
    accessoryItemId: uuid('accessoryItemId').references(() => avatarItems.id),

    jerseyNumber: integer('jerseyNumber'), // Player's number on jersey

    updatedAt: timestamp('updatedAt'), // Nullable - set on update, not on create
  },
  (table) => [unique('AvatarEquipment_avatarId_sportId_key').on(table.avatarId, table.sportId)]
)

export const avatarEquipmentsRelations = relations(avatarEquipments, ({ one }) => ({
  avatar: one(avatars, {
    fields: [avatarEquipments.avatarId],
    references: [avatars.id],
  }),
  sport: one(sports, {
    fields: [avatarEquipments.sportId],
    references: [sports.id],
  }),
  jerseyItem: one(avatarItems, {
    fields: [avatarEquipments.jerseyItemId],
    references: [avatarItems.id],
    relationName: 'jerseyItem',
  }),
  shortsItem: one(avatarItems, {
    fields: [avatarEquipments.shortsItemId],
    references: [avatarItems.id],
    relationName: 'shortsItem',
  }),
  shoesItem: one(avatarItems, {
    fields: [avatarEquipments.shoesItemId],
    references: [avatarItems.id],
    relationName: 'shoesItem',
  }),
  accessoryItem: one(avatarItems, {
    fields: [avatarEquipments.accessoryItemId],
    references: [avatarItems.id],
    relationName: 'accessoryItem',
  }),
}))

// ===========================================
// CHALLENGE TABLES
// ===========================================

export const challenges = pgTable(
  'Challenge',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    venueId: uuid('venueId')
      .notNull()
      .references(() => venues.id),
    sportId: uuid('sportId')
      .notNull()
      .references(() => sports.id),

    name: varchar('name', { length: 255 }).notNull(), // "3-Point Shot"
    description: text('description').notNull(),
    instructions: text('instructions').notNull(),
    challengeType: varchar('challengeType', { length: 50 }).notNull(), // "three_point", "free_throw", "around_the_world", "penalty_kick"

    xpReward: integer('xpReward').notNull(),
    rpReward: integer('rpReward').default(0).notNull(),
    difficulty: varchar('difficulty', { length: 20 }).notNull(), // "easy", "medium", "hard"

    isActive: boolean('isActive').default(true).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt'), // Nullable - set on update, not on create
  },
  (table) => [
    index('Challenge_venueId_idx').on(table.venueId),
    index('Challenge_sportId_idx').on(table.sportId),
    index('Challenge_venueId_sportId_idx').on(table.venueId, table.sportId),
  ]
)

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  venue: one(venues, {
    fields: [challenges.venueId],
    references: [venues.id],
  }),
  sport: one(sports, {
    fields: [challenges.sportId],
    references: [sports.id],
  }),
  attempts: many(challengeAttempts),
}))

export const challengeAttempts = pgTable(
  'ChallengeAttempt',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    challengeId: uuid('challengeId')
      .notNull()
      .references(() => challenges.id),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id),

    // Results (entered via Start/Stop buttons)
    scoreValue: integer('scoreValue').notNull(), // Shots made, goals scored, etc.
    maxValue: integer('maxValue').notNull(), // Shots attempted, total tries

    // Optional video
    videoUrl: varchar('videoUrl', { length: 500 }),

    xpEarned: integer('xpEarned').default(0).notNull(),
    rpEarned: integer('rpEarned').default(0).notNull(),
    completedAt: timestamp('completedAt').defaultNow().notNull(),
  },
  (table) => [
    index('ChallengeAttempt_userId_idx').on(table.userId),
    index('ChallengeAttempt_challengeId_idx').on(table.challengeId),
    index('ChallengeAttempt_userId_challengeId_idx').on(table.userId, table.challengeId),
  ]
)

export const challengeAttemptsRelations = relations(challengeAttempts, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeAttempts.challengeId],
    references: [challenges.id],
  }),
  user: one(users, {
    fields: [challengeAttempts.userId],
    references: [users.id],
  }),
}))

// ===========================================
// MATCH TABLE (1v1)
// ===========================================

export const matches = pgTable(
  'Match',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    venueId: uuid('venueId')
      .notNull()
      .references(() => venues.id),
    sportId: uuid('sportId')
      .notNull()
      .references(() => sports.id),

    // Players
    player1Id: uuid('player1Id')
      .notNull()
      .references(() => users.id),
    player2Id: uuid('player2Id')
      .notNull()
      .references(() => users.id),

    // Result
    player1Score: integer('player1Score'),
    player2Score: integer('player2Score'),
    winnerId: uuid('winnerId').references(() => users.id),

    // Status: "pending", "in_progress", "completed", "disputed", "cancelled"
    status: varchar('status', { length: 20 }).default('pending').notNull(),

    // Verification - both must agree for result to count
    player1Agreed: boolean('player1Agreed').default(false).notNull(),
    player2Agreed: boolean('player2Agreed').default(false).notNull(),

    videoUrl: varchar('videoUrl', { length: 500 }),

    // XP/RP awarded
    winnerXp: integer('winnerXp').default(0).notNull(),
    winnerRp: integer('winnerRp').default(0).notNull(),
    loserXp: integer('loserXp').default(0).notNull(), // Participation XP

    startedAt: timestamp('startedAt'),
    completedAt: timestamp('completedAt'),

    // Dispute fields (nullable)
    disputeReason: varchar('disputeReason', { length: 50 }),
    disputeDetails: text('disputeDetails'),
    disputedBy: uuid('disputedBy').references(() => users.id),
    disputedAt: timestamp('disputedAt'),

    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => [
    index('Match_player1Id_idx').on(table.player1Id),
    index('Match_player2Id_idx').on(table.player2Id),
    index('Match_venueId_idx').on(table.venueId),
    index('Match_status_idx').on(table.status),
  ]
)

export const matchesRelations = relations(matches, ({ one }) => ({
  venue: one(venues, {
    fields: [matches.venueId],
    references: [venues.id],
  }),
  sport: one(sports, {
    fields: [matches.sportId],
    references: [sports.id],
  }),
  player1: one(users, {
    fields: [matches.player1Id],
    references: [users.id],
    relationName: 'player1',
  }),
  player2: one(users, {
    fields: [matches.player2Id],
    references: [users.id],
    relationName: 'player2',
  }),
  winner: one(users, {
    fields: [matches.winnerId],
    references: [users.id],
    relationName: 'winner',
  }),
}))

// ===========================================
// PLAYER STATS TABLE
// ===========================================

export const playerStats = pgTable(
  'PlayerStats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id),
    sportId: uuid('sportId')
      .notNull()
      .references(() => sports.id),

    // XP & RP (dual currency system)
    totalXp: integer('totalXp').default(0).notNull(), // For rankings
    totalRp: integer('totalRp').default(0).notNull(), // Lifetime earned
    availableRp: integer('availableRp').default(0).notNull(), // Spendable balance

    // Match stats (for Trump Card: Wins/Losses)
    matchesPlayed: integer('matchesPlayed').default(0).notNull(),
    matchesWon: integer('matchesWon').default(0).notNull(),
    matchesLost: integer('matchesLost').default(0).notNull(),
    // winRate calculated: matchesWon / matchesPlayed

    // Challenge stats
    challengesCompleted: integer('challengesCompleted').default(0).notNull(),

    // General scoring (for Trump Card: Total Points)
    totalPointsScored: integer('totalPointsScored').default(0).notNull(),

    // Basketball specific stats (for Trump Card detailed stats)
    threePointMade: integer('threePointMade').default(0).notNull(),
    threePointAttempted: integer('threePointAttempted').default(0).notNull(),
    freeThrowMade: integer('freeThrowMade').default(0).notNull(),
    freeThrowAttempted: integer('freeThrowAttempted').default(0).notNull(),
    // Accuracies calculated: made / attempted

    // Invites tracking
    usersInvited: integer('usersInvited').default(0).notNull(),

    updatedAt: timestamp('updatedAt'), // Nullable - set on update, not on create
  },
  (table) => [
    unique('PlayerStats_userId_sportId_key').on(table.userId, table.sportId),
    index('PlayerStats_userId_idx').on(table.userId),
    index('PlayerStats_sportId_totalXp_idx').on(table.sportId, table.totalXp),
  ]
)

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  user: one(users, {
    fields: [playerStats.userId],
    references: [users.id],
  }),
  sport: one(sports, {
    fields: [playerStats.sportId],
    references: [sports.id],
  }),
}))

// ===========================================
// ACTIVE PLAYER TRACKING
// ===========================================

export const activePlayers = pgTable(
  'ActivePlayer',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id),
    venueId: uuid('venueId')
      .notNull()
      .references(() => venues.id),

    // Last known position
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    lastSeenAt: timestamp('lastSeenAt').defaultNow().notNull(),

    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => [
    unique('ActivePlayer_userId_venueId_key').on(table.userId, table.venueId),
    index('ActivePlayer_venueId_idx').on(table.venueId),
    index('ActivePlayer_lastSeenAt_idx').on(table.lastSeenAt),
  ]
)

export const activePlayersRelations = relations(activePlayers, ({ one }) => ({
  user: one(users, {
    fields: [activePlayers.userId],
    references: [users.id],
  }),
  venue: one(venues, {
    fields: [activePlayers.venueId],
    references: [venues.id],
  }),
}))
