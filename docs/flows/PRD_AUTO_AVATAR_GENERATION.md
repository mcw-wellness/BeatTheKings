# PRD: Auto Avatar Generation from Profile Photo

## Overview

Automatically generate a personalized avatar based on the user's uploaded profile picture. This eliminates the need for users to manually configure avatar features and provides an immediate personalized experience.

## Problem Statement

Currently, users see a generic default avatar on the Create Avatar screen. The profile picture uploaded in step 3 is not used as a reference for avatar creation, despite the doc stating it should be.

## Solution

Use AI (Google Gemini) to analyze the user's profile photo and extract visual features, then auto-generate an avatar that resembles the user.

---

## User Flow

```
Photo Upload Page                    Avatar Page
      │                                   │
      ▼                                   │
[User uploads photo]                      │
      │                                   │
      ▼                                   │
[Photo saved to Azure]                    │
      │                                   │
      ▼                                   │
[AI analyzes photo]                       │
  - Detect skin tone                      │
  - Detect hair style                     │
  - Detect hair color                     │
  - Detect gender (if not set)            │
      │                                   │
      ▼                                   │
[Auto-generate avatar]                    │
      │                                   │
      ▼                                   │
[Save avatar to DB + Azure]               │
      │                                   │
      ▼                                   │
[Redirect to Avatar page] ───────────────►│
                                          │
                                          ▼
                              [Show auto-generated avatar]
                                          │
                                          ▼
                              [User can customize if desired]
                                          │
                                          ▼
                              [Save & proceed to TomTom]
```

---

## Technical Approach

### API Endpoints

#### 1. `POST /api/photo/analyze` (New)

Analyzes uploaded photo and extracts avatar features.

**Request:**

```json
{
  "imageUrl": "string (SAS URL or base64)"
}
```

**Response:**

```json
{
  "success": true,
  "features": {
    "skinTone": "light" | "fair" | "medium" | "tan" | "dark",
    "hairStyle": "short" | "medium" | "long" | "bald" | "curly" | "braids" | "ponytail" | "afro",
    "hairColor": "black" | "brown" | "blonde" | "red" | "gray" | "white",
    "gender": "male" | "female"
  }
}
```

#### 2. `POST /api/users/profile-picture` (Update)

Update existing endpoint to:

1. Upload photo to Azure
2. Call `/api/photo/analyze` to extract features
3. Auto-generate avatar using extracted features
4. Save avatar to DB

---

## Data Model

No schema changes required. Uses existing:

- `User.profilePictureUrl` - stores photo path
- `Avatar` table - stores avatar configuration
- `AvatarEquipment` table - stores equipment

---

## AI Analysis (Gemini)

### Prompt for Feature Extraction

```
Analyze this photo of a person and extract the following features for avatar creation:

1. Skin tone: Choose ONE from [light, fair, medium, tan, dark]
2. Hair style: Choose ONE from [short, medium, long, bald, curly, braids, ponytail, afro]
3. Hair color: Choose ONE from [black, brown, blonde, red, gray, white]
4. Gender appearance: Choose ONE from [male, female]

Respond ONLY with valid JSON in this exact format:
{
  "skinTone": "value",
  "hairStyle": "value",
  "hairColor": "value",
  "gender": "value"
}
```

---

## Acceptance Criteria

1. [ ] User uploads photo on Photo page
2. [ ] System analyzes photo using Gemini AI
3. [ ] System extracts: skin tone, hair style, hair color, gender
4. [ ] System auto-generates avatar with extracted features
5. [ ] Avatar is saved to database and Azure storage
6. [ ] User is redirected to Avatar page
7. [ ] Avatar page shows the auto-generated avatar (not default)
8. [ ] User can still customize and regenerate if desired
9. [ ] Error handling: If AI analysis fails, use defaults and continue

---

## Error Handling

| Scenario                | Action                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------- |
| AI analysis fails       | Use default values (medium skin, short hair, black hair, user's registered gender) |
| Avatar generation fails | Log error, show error message, allow manual creation                               |
| Photo upload fails      | Show error, allow retry                                                            |

---

## Files to Modify/Create

| File                                         | Action                                         |
| -------------------------------------------- | ---------------------------------------------- |
| `src/app/api/photo/analyze/route.ts`         | CREATE - AI analysis endpoint                  |
| `src/app/api/users/profile-picture/route.ts` | UPDATE - Add auto-avatar generation            |
| `src/app/(auth)/photo/page.tsx`              | UPDATE - Show loading state during generation  |
| `src/lib/ai/analyze-photo.ts`                | CREATE - Gemini integration for photo analysis |

---

## Testing

### Unit Tests

- `analyze-photo.test.ts` - Test feature extraction parsing
- Test fallback to defaults on AI failure

### Integration Tests

- Test full flow: upload → analyze → generate → save
- Test error scenarios
