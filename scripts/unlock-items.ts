import 'dotenv/config'
import { getDb } from '../src/db'
import { users, avatarItems, userUnlockedItems } from '../src/db/schema'
import { eq, like, and } from 'drizzle-orm'

async function unlockAllForUser() {
  const db = getDb()

  // Find shawaiz user
  const user = await db
    .select()
    .from(users)
    .where(like(users.email, '%shawaiz%'))
    .limit(1)

  if (user.length === 0) {
    console.log('User not found')
    return
  }

  console.log('Found user:', user[0].name, user[0].id)

  // Get all jerseys and shoes (sportId is null for global items)
  const items = await db.select().from(avatarItems)

  const jerseys = items.filter((i) => i.itemType === 'jersey')
  const shoes = items.filter((i) => i.itemType === 'shoes')

  console.log('Found', jerseys.length, 'jerseys and', shoes.length, 'shoes')

  // Unlock all for user
  for (const item of [...jerseys, ...shoes]) {
    // Check if already unlocked
    const existing = await db
      .select()
      .from(userUnlockedItems)
      .where(
        and(eq(userUnlockedItems.userId, user[0].id), eq(userUnlockedItems.itemId, item.id))
      )
      .limit(1)

    if (existing.length === 0) {
      await db.insert(userUnlockedItems).values({
        userId: user[0].id,
        itemId: item.id,
        unlockedVia: 'admin',
      })
      console.log('Unlocked:', item.name)
    } else {
      console.log('Already unlocked:', item.name)
    }
  }

  console.log('Done!')
  process.exit(0)
}

unlockAllForUser().catch(console.error)
