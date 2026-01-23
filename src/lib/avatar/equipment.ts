// Avatar equipment operations

import { eq } from 'drizzle-orm'
import { avatarItems, avatarEquipments, userUnlockedItems, sports } from '@/db/schema'
import type { Database } from '@/db'

export async function getDefaultItems(db: Database) {
  return db.select().from(avatarItems).where(eq(avatarItems.isDefault, true))
}

export async function unlockDefaultItems(db: Database, userId: string) {
  const defaultItems = await getDefaultItems(db)
  if (defaultItems.length === 0) return []

  const unlockRecords = defaultItems.map((item) => ({
    userId,
    itemId: item.id,
    unlockedVia: 'default' as const,
  }))

  return db
    .insert(userUnlockedItems)
    .values(unlockRecords)
    .onConflictDoNothing({ target: [userUnlockedItems.userId, userUnlockedItems.itemId] })
    .returning()
}

export async function getBasketballSportId(db: Database): Promise<string | null> {
  const [sport] = await db
    .select({ id: sports.id })
    .from(sports)
    .where(eq(sports.slug, 'basketball'))
    .limit(1)
  return sport?.id || null
}

export async function createDefaultEquipment(
  db: Database,
  avatarId: string,
  sportId: string,
  defaultItems: { id: string; itemType: string }[],
  jerseyNumber?: number
) {
  const jersey = defaultItems.find((i) => i.itemType === 'jersey')
  const shorts = defaultItems.find((i) => i.itemType === 'shorts')
  const shoes = defaultItems.find((i) => i.itemType === 'shoes')

  const [equipment] = await db
    .insert(avatarEquipments)
    .values({
      avatarId,
      sportId,
      jerseyItemId: jersey?.id || null,
      shortsItemId: shorts?.id || null,
      shoesItemId: shoes?.id || null,
      jerseyNumber: jerseyNumber ?? 10,
    })
    .returning()

  return equipment
}

export async function upsertEquipment(
  db: Database,
  avatarId: string,
  sportId: string,
  defaultItems: { id: string; itemType: string }[],
  jerseyNumber?: number,
  shoesItemId?: string,
  jerseyItemId?: string
) {
  const defaultJersey = defaultItems.find((i) => i.itemType === 'jersey')
  const shorts = defaultItems.find((i) => i.itemType === 'shorts')
  const defaultShoes = defaultItems.find((i) => i.itemType === 'shoes')
  const finalShoesId = shoesItemId || defaultShoes?.id || null
  const finalJerseyId = jerseyItemId || defaultJersey?.id || null

  const [equipment] = await db
    .insert(avatarEquipments)
    .values({
      avatarId,
      sportId,
      jerseyItemId: finalJerseyId,
      shortsItemId: shorts?.id || null,
      shoesItemId: finalShoesId,
      jerseyNumber: jerseyNumber ?? 10,
    })
    .onConflictDoUpdate({
      target: [avatarEquipments.avatarId, avatarEquipments.sportId],
      set: {
        jerseyNumber: jerseyNumber ?? 10,
        shoesItemId: finalShoesId,
        jerseyItemId: finalJerseyId,
        updatedAt: new Date(),
      },
    })
    .returning()

  return equipment
}

export async function getUserUnlockedItems(db: Database, userId: string, sportId?: string) {
  const results = await db
    .select({ unlocked: userUnlockedItems, item: avatarItems })
    .from(userUnlockedItems)
    .innerJoin(avatarItems, eq(userUnlockedItems.itemId, avatarItems.id))
    .where(eq(userUnlockedItems.userId, userId))

  if (sportId) {
    return results.filter((r) => r.item.sportId === sportId || r.item.sportId === null)
  }
  return results
}
