# AI-Generated Avatar System

**Status:** Proposed
**Date:** 2025-12-18
**Technology:** Google Gemini 2.0 (Flash or Pro - TBD)

---

## Overview

Instead of building a complex SVG layer system or using limited avatar libraries, we use AI image generation to create custom sports avatars based on user preferences.

**Flow:**

1. User answers preference questions during onboarding
2. System builds a structured prompt from preferences
3. Gemini 2.0 generates a custom avatar image
4. Image is stored and displayed as the user's avatar

---

## Why AI Generation?

| Approach                      | Pros                           | Cons                              |
| ----------------------------- | ------------------------------ | --------------------------------- |
| **SVG Libraries (Avataaars)** | Fast, consistent               | No sports outfits, fixed style    |
| **Custom SVG Layers**         | Full control                   | Need artist, complex dev          |
| **3D SDKs (Ready Player Me)** | Rich customization             | Overkill, wrong style, costs      |
| **AI Generation (Gemini)**    | Flexible, unique, sports-ready | API costs, consistency challenges |

**Decision:** AI generation gives us sports-specific avatars without needing custom art assets.

---

## User Preference Fields

### Physical Appearance

| Field      | Type | Options                                                    |
| ---------- | ---- | ---------------------------------------------------------- |
| `skinTone` | enum | `light`, `fair`, `medium`, `olive`, `tan`, `brown`, `dark` |
| `gender`   | enum | `male`, `female`                                           |
| `bodyType` | enum | `slim`, `athletic`, `average`, `muscular`                  |

### Hair

| Field       | Type | Options                                                                          |
| ----------- | ---- | -------------------------------------------------------------------------------- |
| `hairStyle` | enum | `short`, `medium`, `long`, `bald`, `buzz`, `afro`, `braids`, `ponytail`, `curly` |
| `hairColor` | enum | `black`, `brown`, `blonde`, `red`, `gray`, `white`                               |

### Facial Hair (Optional)

| Field        | Type | Options                                               |
| ------------ | ---- | ----------------------------------------------------- |
| `facialHair` | enum | `none`, `stubble`, `goatee`, `full_beard`, `mustache` |

### Sport & Outfit

| Field         | Type   | Options/Notes                                      |
| ------------- | ------ | -------------------------------------------------- |
| `sport`       | enum   | `basketball`, `soccer`, `running`, `cycling`       |
| `jerseyColor` | string | Hex color or named color                           |
| `shortsColor` | string | Hex color or named color                           |
| `shoeStyle`   | enum   | `high_tops`, `low_tops`, `cleats`, `running_shoes` |
| `shoeColor`   | string | Hex color or named color                           |

### Accessories

| Field         | Type  | Options                                                 |
| ------------- | ----- | ------------------------------------------------------- |
| `accessories` | array | `headband`, `wristband`, `glasses`, `cap`, `arm_sleeve` |

### System-Added (not user-selected)

| Field       | Type    | Description                      |
| ----------- | ------- | -------------------------------- |
| `isKing`    | boolean | Adds golden crown to avatar      |
| `rankBadge` | number  | Shows rank number (#1, #2, etc.) |

---

## TypeScript Interface

```typescript
interface AvatarPreferences {
  // Physical Appearance
  skinTone: 'light' | 'fair' | 'medium' | 'olive' | 'tan' | 'brown' | 'dark'
  gender: 'male' | 'female'
  bodyType: 'slim' | 'athletic' | 'average' | 'muscular'

  // Hair
  hairStyle:
    | 'short'
    | 'medium'
    | 'long'
    | 'bald'
    | 'buzz'
    | 'afro'
    | 'braids'
    | 'ponytail'
    | 'curly'
  hairColor: 'black' | 'brown' | 'blonde' | 'red' | 'gray' | 'white'

  // Facial Hair (optional)
  facialHair?: 'none' | 'stubble' | 'goatee' | 'full_beard' | 'mustache'

  // Sport & Outfit
  sport: 'basketball' | 'soccer' | 'running' | 'cycling'
  jerseyColor: string
  shortsColor: string
  shoeStyle: 'high_tops' | 'low_tops' | 'cleats' | 'running_shoes'
  shoeColor: string

  // Accessories
  accessories: ('headband' | 'wristband' | 'glasses' | 'cap' | 'arm_sleeve')[]

  // System-added
  isKing?: boolean
  rankBadge?: number
}
```

---

## Prompt Building

### Base Style Prompt

```
Cartoon sports avatar illustration, mobile game card style,
vibrant colors, clean vector-like art, full body standing pose,
stadium background, similar to NBA 2K or FIFA mobile card art style,
high quality, detailed
```

### Prompt Template

```typescript
function buildAvatarPrompt(prefs: AvatarPreferences): string {
  const baseStyle = `
    Cartoon sports avatar illustration, mobile game card style,
    vibrant colors, clean vector-like art, full body standing pose,
    stadium background, similar to NBA 2K or FIFA mobile card art style
  `

  const character = `
    ${prefs.gender} athlete with ${prefs.skinTone} skin tone,
    ${prefs.bodyType} build,
    ${prefs.hairStyle} ${prefs.hairColor} hair
    ${prefs.facialHair && prefs.facialHair !== 'none' ? `, ${prefs.facialHair} facial hair` : ''}
  `

  const outfits: Record<string, string> = {
    basketball: `wearing basketball jersey (${prefs.jerseyColor}),
                 basketball shorts (${prefs.shortsColor}),
                 ${prefs.shoeStyle} basketball shoes (${prefs.shoeColor}),
                 holding basketball, confident pose`,
    soccer: `wearing soccer jersey (${prefs.jerseyColor}),
             soccer shorts (${prefs.shortsColor}),
             soccer cleats (${prefs.shoeColor}),
             foot on soccer ball`,
    running: `wearing running singlet (${prefs.jerseyColor}),
              running shorts (${prefs.shortsColor}),
              running shoes (${prefs.shoeColor}),
              dynamic running pose`,
    cycling: `wearing cycling jersey (${prefs.jerseyColor}),
              cycling shorts (${prefs.shortsColor}),
              cycling shoes, helmet`,
  }

  const accessories = prefs.accessories?.length ? `wearing ${prefs.accessories.join(', ')}` : ''

  const kingStatus = prefs.isKing
    ? 'wearing a golden crown on head, champion pose, golden aura'
    : ''

  return `${baseStyle}. ${character}. ${outfits[prefs.sport]}. ${accessories}. ${kingStatus}`
}
```

---

## Example Generated Prompts

### Basketball King (Male)

```
Cartoon sports avatar illustration, mobile game card style,
vibrant colors, clean vector-like art, full body standing pose,
stadium background, similar to NBA 2K or FIFA mobile card art style.

Male athlete with tan skin tone, athletic build, short black hair,
full beard facial hair.

Wearing basketball jersey (blue with gold trim), basketball shorts (blue),
high tops basketball shoes (blue and white), holding basketball, confident pose.

Wearing headband, wristband.

Wearing a golden crown on head, champion pose, golden aura.
```

### Female Soccer Player

```
Cartoon sports avatar illustration, mobile game card style,
vibrant colors, clean vector-like art, full body standing pose,
stadium background, similar to NBA 2K or FIFA mobile card art style.

Female athlete with medium skin tone, athletic build, ponytail brown hair.

Wearing soccer jersey (red), soccer shorts (white),
soccer cleats (black), foot on soccer ball.
```

---

## API Integration

### Gemini 2.0 Setup

```typescript
// lib/gemini-avatar.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateAvatar(prefs: AvatarPreferences): Promise<string> {
  // Use Gemini for image generation (500 images/day free)
  // Model: gemini-2.0-flash-exp-image-generation or gemini-2.5-flash-image-preview
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp-image-generation',
  })

  const prompt = buildAvatarPrompt(prefs)

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['image'],
      // Additional config as needed
    },
  })

  // Extract image data from response
  const imageData = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData

  if (!imageData) {
    throw new Error('Failed to generate avatar image')
  }

  // Upload to cloud storage and return URL
  const imageUrl = await uploadToStorage(imageData.data, imageData.mimeType)

  return imageUrl
}
```

### API Route

```typescript
// app/api/avatar/generate/route.ts
import { generateAvatar } from '@/lib/gemini-avatar'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const preferences: AvatarPreferences = await req.json()

  try {
    const imageUrl = await generateAvatar(preferences)

    // Save to database
    await prisma.avatarImage.create({
      data: {
        avatarId: session.user.avatarId,
        sport: preferences.sport,
        imageUrl,
        isKing: preferences.isKing ?? false,
        prompt: buildAvatarPrompt(preferences),
      },
    })

    return Response.json({ imageUrl })
  } catch (error) {
    return Response.json({ error: 'Generation failed' }, { status: 500 })
  }
}
```

---

## Database Schema

```prisma
model Avatar {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])

  // Physical
  skinTone        String
  gender          String
  bodyType        String

  // Hair
  hairStyle       String
  hairColor       String
  facialHair      String?

  // Default Sport Outfit
  sport           String
  jerseyColor     String
  shortsColor     String
  shoeStyle       String
  shoeColor       String

  // Accessories (JSON array)
  accessories     Json     @default("[]")

  // Generated Images
  generatedImages AvatarImage[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AvatarImage {
  id          String   @id @default(uuid())
  avatarId    String
  avatar      Avatar   @relation(fields: [avatarId], references: [id])

  sport       String           // which sport this image is for
  imageUrl    String           // cloud storage URL
  isKing      Boolean @default(false)
  prompt      String  @db.Text // the prompt used (for debugging/regeneration)

  createdAt   DateTime @default(now())
}
```

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AVATAR CREATION WIZARD                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Your Look                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Skin Tone:  [○] [○] [○] [○] [○] [○] [○]           │   │
│  │  Body Type:  [Slim] [Athletic] [Average] [Muscular] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Step 2: Hair Style                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Style: [▼ Short        ]                           │   │
│  │  Color: [▼ Black        ]                           │   │
│  │  Facial Hair: [▼ None   ] (if male)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Step 3: Your Sport                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       🏀            ⚽           🏃          🚴      │   │
│  │   Basketball     Soccer      Running     Cycling    │   │
│  │      [●]          [ ]          [ ]         [ ]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Step 4: Outfit Colors                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Jersey:  [🎨 Blue    ]                             │   │
│  │  Shorts:  [🎨 White   ]                             │   │
│  │  Shoes:   [▼ High Tops] [🎨 Red]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Step 5: Accessories (optional)                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [✓] Headband  [ ] Wristband  [ ] Glasses  [ ] Cap  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                  [ Generate My Avatar ]                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    PREVIEW & CONFIRM                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              [Generated Avatar Image]               │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│        [ 🔄 Regenerate ]            [ ✓ Save Avatar ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Considerations

### Model Selection

| Model ID | Free Tier | Quality | Notes |
| -------- | --------- | ------- | ----- |
| `gemini-2.0-flash-exp-image-generation` | 500/day | Good | Best for MVP |
| `imagen-3.0-generate-002` | 10-20/day | Higher | Better quality |

**Recommendation:** Use `gemini-2.0-flash-exp-image-generation` for MVP (500 free images/day).

### Consistency Challenges

AI generation may produce varying styles. Mitigations:

1. **Detailed style prompt** - Include specific art style references
2. **Reference image** - Include example avatar in prompt (if supported)
3. **Regeneration option** - Let users regenerate if unhappy
4. **Seed parameter** - Use consistent seed for similar inputs (if available)

### Cost Management

- Cache generated images (don't regenerate same config)
- Limit regenerations per user (e.g., 3 per day)
- Generate once per sport (not on every view)
- Regenerate only when user changes preferences

### When to Regenerate

Avatar should be regenerated when:

1. User changes any preference
2. User becomes/loses King status
3. User explicitly requests regeneration
4. User switches to a new sport (new outfit needed)

---

## MVP Scope

### Phase 1 (MVP)

- Basic preferences (skin, hair, sport, jersey color)
- Single sport per user
- Generate on avatar creation
- Store one image per user

### Phase 2

- Multiple sports per user
- King/non-king versions
- Accessories
- Regeneration limits

### Phase 3

- Style variations
- Seasonal outfits
- Team jerseys
- Achievement-based accessories

---

## References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini 2.0 Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google AI Studio](https://aistudio.google.com/)

---

## Open Questions

1. **Flash vs Pro** - Need to test both for quality/consistency
2. **Image dimensions** - What size works best for cards? (512x512? 1024x1024?)
3. **Storage** - Cloudinary? S3? Vercel Blob?
4. **Rate limits** - How many generations per user per day?
5. **Fallback** - What if generation fails? Default avatar?
