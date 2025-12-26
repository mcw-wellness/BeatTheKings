# PRD: Avatar Creation Flow

**Version:** 2.1
**Date:** December 2025
**Status:** Ready for Development

---

## Overview

The Avatar Creation flow allows users to customize their in-game character using **AI-generated images** powered by **Google Gemini 2.0**. Avatars are stored in **Azure Blob Storage** with a folder structure per user.

---

## Architecture

### Storage Structure (Azure Blob Storage)

```
avatars/                          # Container
├── default/                      # Shared default avatars
│   ├── basketball_male.png
│   ├── basketball_female.png
│   ├── soccer_male.png
│   └── soccer_female.png
│
└── users/                        # Per-user custom avatars
    └── {userId}/
        └── avatar.png            # User's custom avatar
```

### Avatar Types

| Type | Description | When Generated |
|------|-------------|----------------|
| **Default Avatar** | Pre-generated, shared by all new users | Once at app setup |
| **Custom Avatar** | AI-generated based on user preferences | When user customizes |

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| AI Generation | Google Gemini (`gemini-2.0-flash-exp-image-generation`) |
| Image Storage | Azure Blob Storage |
| API Framework | Next.js API Routes |
| Database | PostgreSQL (Drizzle ORM) |

---

## Database Schema (Minimal Change)

### Existing Schema (Keep As-Is)

```typescript
// avatars table - EXISTING fields
export const avatars = pgTable('Avatar', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().unique().references(() => users.id),

  // Base appearance - EXISTING
  skinTone: varchar('skinTone', { length: 50 }),   // light, medium, dark, etc.
  hairStyle: varchar('hairStyle', { length: 50 }), // short, afro, braids, etc.
  hairColor: varchar('hairColor', { length: 50 }), // black, brown, blonde, etc.

  // ADD THIS FIELD ONLY
  imageUrl: varchar('imageUrl', { length: 500 }),  // Generated avatar URL

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

// Gender comes from users table - EXISTING
users.gender // 'Male', 'Female', 'Other'
```

### Migration

```sql
-- Only one field to add
ALTER TABLE "Avatar" ADD COLUMN "imageUrl" VARCHAR(500);
```

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   AVATAR CREATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NEW USER (after registration)                               │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────┐                    │
│  │  AVATAR CUSTOMIZATION               │                    │
│  │                                     │                    │
│  │  Skin Tone: [○][○][●][○][○]        │                    │
│  │                                     │                    │
│  │  Hair Style:                        │                    │
│  │  [Short][Afro][Braids][Long][Bald] │                    │
│  │                                     │                    │
│  │  Hair Color:                        │                    │
│  │  [●][○][○][○][○][○]                │                    │
│  │                                     │                    │
│  │  [ Generate Avatar ]                │                    │
│  └─────────────────────────────────────┘                    │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────┐                    │
│  │  GENERATING... (5-10 seconds)       │                    │
│  │  [Loading spinner]                  │                    │
│  │  "Creating your unique avatar..."   │                    │
│  └─────────────────────────────────────┘                    │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────┐                    │
│  │  PREVIEW                            │                    │
│  │  ┌───────────────────┐             │                    │
│  │  │                   │             │                    │
│  │  │  [AI Generated   │             │                    │
│  │  │   Avatar Image]  │             │                    │
│  │  │                   │             │                    │
│  │  └───────────────────┘             │                    │
│  │                                     │                    │
│  │  [🔄 Regenerate]  [✓ Save & Continue] │                 │
│  └─────────────────────────────────────┘                    │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────┐                    │
│  │  SAVE                               │                    │
│  │  → Upload to Azure: users/{id}/avatar.png │              │
│  │  → Save URL to database             │                    │
│  │  → Set hasCreatedAvatar = true      │                    │
│  └─────────────────────────────────────┘                    │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────┐                    │
│  │  REDIRECT TO /welcome               │                    │
│  │  Features now unlocked!             │                    │
│  └─────────────────────────────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## User Preferences (Using Existing Fields)

| Field | Source | Options |
|-------|--------|---------|
| `gender` | `users.gender` | Male, Female, Other |
| `skinTone` | `avatars.skinTone` | light, medium-light, medium, medium-dark, dark |
| `hairStyle` | `avatars.hairStyle` | short, medium, long, bald, afro, braids, dreads, mohawk |
| `hairColor` | `avatars.hairColor` | black, brown, blonde, red, gray, white |

**Outfit colors:** Use defaults based on sport (blue jersey for basketball, etc.)

---

## API Endpoints

### POST /api/users/avatar
Create avatar with preferences and generate AI image.

**Request:**
```json
{
  "skinTone": "medium",
  "hairStyle": "short",
  "hairColor": "black"
}
```

**Response (201):**
```json
{
  "success": true,
  "avatar": {
    "id": "uuid",
    "skinTone": "medium",
    "hairStyle": "short",
    "hairColor": "black",
    "imageUrl": "https://beatthekings.blob.core.windows.net/avatars/users/{userId}/avatar.png"
  },
  "redirectTo": "/welcome"
}
```

---

### PUT /api/users/avatar
Update avatar preferences and regenerate AI image.

**Request:**
```json
{
  "skinTone": "dark",
  "hairStyle": "afro",
  "hairColor": "black"
}
```

**Response (200):**
```json
{
  "success": true,
  "avatar": {
    "id": "uuid",
    "skinTone": "dark",
    "hairStyle": "afro",
    "hairColor": "black",
    "imageUrl": "https://beatthekings.blob.core.windows.net/avatars/users/{userId}/avatar.png"
  }
}
```

---

### GET /api/users/avatar
Get current user's avatar.

**Response (200):**
```json
{
  "avatar": {
    "id": "uuid",
    "skinTone": "medium",
    "hairStyle": "short",
    "hairColor": "black",
    "imageUrl": "https://..."
  }
}
```

---

## Gemini AI Integration

### Prompt Building

```typescript
interface AvatarPromptInput {
  gender: string      // From users.gender
  skinTone: string    // From avatars.skinTone
  hairStyle: string   // From avatars.hairStyle
  hairColor: string   // From avatars.hairColor
  sport?: string      // Default: basketball
}

function buildAvatarPrompt(input: AvatarPromptInput): string {
  const baseStyle = `
    Cartoon sports avatar illustration, mobile game card style,
    vibrant colors, clean vector-like art, full body standing pose,
    stadium background, similar to NBA 2K or FIFA mobile card art style,
    high quality, detailed
  `

  const character = `
    ${input.gender} athlete with ${input.skinTone} skin tone,
    athletic build,
    ${input.hairStyle} ${input.hairColor} hair
  `

  const sport = input.sport || 'basketball'

  const outfit = sport === 'basketball'
    ? 'wearing blue basketball jersey, blue shorts, white high-top shoes, holding basketball, confident pose'
    : 'wearing red soccer jersey, white shorts, black cleats, foot on soccer ball'

  return `${baseStyle}. ${character}. ${outfit}.`
}
```

### Example Prompt

```
Cartoon sports avatar illustration, mobile game card style,
vibrant colors, clean vector-like art, full body standing pose,
stadium background, similar to NBA 2K or FIFA mobile card art style,
high quality, detailed.

Male athlete with medium skin tone, athletic build, short black hair.

Wearing blue basketball jersey, blue shorts, white high-top shoes,
holding basketball, confident pose.
```

---

## Azure Blob Storage Integration

### Upload Function

```typescript
// lib/azure-storage.ts
import { BlobServiceClient } from '@azure/storage-blob'

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
)
const containerClient = blobServiceClient.getContainerClient('avatars')

export async function uploadAvatar(
  userId: string,
  imageBuffer: Buffer
): Promise<string> {
  const blobPath = `users/${userId}/avatar.png`
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath)

  await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
    blobHTTPHeaders: { blobContentType: 'image/png' }
  })

  return blockBlobClient.url
}

export function getDefaultAvatarUrl(gender: string): string {
  const genderKey = gender.toLowerCase() === 'female' ? 'female' : 'male'
  return `${process.env.NEXT_PUBLIC_AZURE_STORAGE_URL}/avatars/default/basketball_${genderKey}.png`
}
```

---

## Default Avatars (One-Time Setup)

Generate 4 default avatars and upload to Azure:

| File | Description |
|------|-------------|
| `default/basketball_male.png` | Default male basketball player |
| `default/basketball_female.png` | Default female basketball player |
| `default/soccer_male.png` | Default male soccer player |
| `default/soccer_female.png` | Default female soccer player |

---

## Environment Variables

```env
# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=beatthekings;AccountKey=...
NEXT_PUBLIC_AZURE_STORAGE_URL=https://beatthekings.blob.core.windows.net

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
```

---

## Implementation Order

1. **Add `imageUrl` field** to avatars schema
2. **Setup Azure Blob** - Create `avatars` container
3. **Generate default avatars** - Upload 4 default images
4. **Implement Gemini wrapper** - `lib/gemini.ts`
5. **Implement Azure upload** - `lib/azure-storage.ts`
6. **Update API routes** - Add AI generation to POST/PUT
7. **Update UI** - Show generated image, add regenerate button

---

## Test Scenarios

### Unit Tests
- [ ] Validate skinTone options
- [ ] Validate hairStyle options
- [ ] Validate hairColor options
- [ ] Build prompt correctly

### Integration Tests
- [ ] POST creates avatar and generates image
- [ ] PUT updates avatar and regenerates image
- [ ] GET returns avatar with imageUrl
- [ ] Image uploaded to correct Azure path

---

## Success Metrics

- Avatar generation completes in < 15 seconds
- < 1% generation failure rate
- Users can regenerate if unhappy with result

---

## Rate Limiting

| Constraint | Limit |
|------------|-------|
| Free tier | 500 images/day |
| Regeneration limit | 3 per user per day |
| Image size | 1024x1024 |
