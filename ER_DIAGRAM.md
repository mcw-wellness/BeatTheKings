# Entity Relationship Diagram

## MVP Phase 1 - Core Database Schema

```mermaid
erDiagram
    User ||--o{ ChallengeSubmission : submits
    User ||--o| PlayerStats : has
    User ||--o{ Venue : "is king of"

    Venue ||--o{ Challenge : contains
    Venue ||--o| User : "current king"

    Challenge ||--o{ ChallengeSubmission : receives

    User {
        uuid id PK
        varchar email UK
        boolean emailVerified
        varchar verificationCode
        timestamp verificationCodeExpiry
        varchar name
        integer age
        varchar gender
        varchar location
        varchar profilePictureUrl
        timestamp createdAt
        timestamp updatedAt
    }

    Venue {
        uuid id PK
        varchar name
        varchar venueType
        varchar sportType
        varchar address
        decimal latitude
        decimal longitude
        varchar city
        varchar country
        integer activePlayerCount
        uuid currentKingId FK
        text description
        timestamp createdAt
        timestamp updatedAt
    }

    Challenge {
        uuid id PK
        uuid venueId FK
        varchar name
        text description
        text instructions
        varchar challengeType
        jsonb parameters
        integer xpReward
        varchar difficulty
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }

    ChallengeSubmission {
        uuid id PK
        uuid challengeId FK
        uuid userId FK
        varchar videoUrl
        jsonb performanceData
        varchar verificationStatus
        timestamp verifiedAt
        integer xpEarned
        timestamp createdAt
    }

    PlayerStats {
        uuid id PK
        uuid userId FK
        integer totalXp
        integer currentRank
        integer totalChallenges
        varchar sportType
        jsonb venueStatsJson
        timestamp updatedAt
    }
```

## MVP Phase 2 - Enhanced Features

```mermaid
erDiagram
    User ||--o| Avatar : has
    Avatar ||--o{ AvatarEquipment : "has loadouts"
    User ||--o{ ActivePlayer : "plays at"
    Venue ||--o{ ActivePlayer : "has players"

    User {
        uuid id PK
    }

    Venue {
        uuid id PK
    }

    Avatar {
        uuid id PK
        uuid userId FK
        varchar hairColor
        varchar hairStyle
        timestamp createdAt
        timestamp updatedAt
    }

    AvatarEquipment {
        uuid id PK
        uuid avatarId FK
        varchar sportType
        jsonb equippedItems
        timestamp updatedAt
    }

    ActivePlayer {
        uuid id PK
        uuid userId FK
        uuid venueId FK
        timestamp lastSeenAt
        boolean isPlaying
    }

    MonthlyChallenge {
        uuid id PK
        varchar title
        text description
        varchar sportType
        timestamp startDate
        timestamp endDate
        text prizeDescription
        jsonb topPlayerIds
        boolean isActive
        timestamp createdAt
    }
```

## Future Enhancement - Sport as First-Class Entity

```mermaid
erDiagram
    Sport ||--o{ Venue : "played at"
    Sport ||--o{ EquipmentCatalog : "has items"
    Sport ||--o{ ChallengeTemplate : "has templates"
    Sport ||--o{ PlayerStats : "tracks stats"

    User ||--o{ UserEquipment : unlocks
    EquipmentCatalog ||--o{ UserEquipment : "unlocked by"

    User ||--o{ VenueRanking : "ranked at"
    Venue ||--o{ VenueRanking : ranks

    User ||--o{ CityRanking : "ranked in"
    Sport ||--o{ CityRanking : "ranks for"

    User ||--o{ CountryRanking : "ranked in"
    Sport ||--o{ CountryRanking : "ranks for"

    ChallengeTemplate ||--o{ Challenge : "creates instances"

    Sport {
        uuid id PK
        varchar name UK
        varchar slug UK
        varchar iconUrl
        boolean isActive
        integer displayOrder
        timestamp createdAt
    }

    EquipmentCatalog {
        uuid id PK
        uuid sportId FK
        varchar name
        varchar itemType
        varchar imageUrl
        varchar rarity
        jsonb unlockRequirement
        integer price
        boolean isActive
        timestamp createdAt
    }

    UserEquipment {
        uuid id PK
        uuid userId FK
        uuid equipmentId FK
        timestamp unlockedAt
    }

    VenueRanking {
        uuid id PK
        uuid userId FK
        uuid venueId FK
        integer rank
        integer totalXp
        boolean isKing
        timestamp lastPlayedAt
        timestamp updatedAt
    }

    CityRanking {
        uuid id PK
        uuid userId FK
        uuid sportId FK
        varchar city
        integer rank
        integer totalXp
        timestamp updatedAt
    }

    CountryRanking {
        uuid id PK
        uuid userId FK
        uuid sportId FK
        varchar country
        integer rank
        integer totalXp
        timestamp updatedAt
    }

    ChallengeTemplate {
        uuid id PK
        uuid sportId FK
        varchar name
        text description
        text instructions
        jsonb verificationCriteria
        varchar difficulty
        integer baseXpReward
        boolean isActive
        timestamp createdAt
    }

    Sponsor {
        uuid id PK
        varchar name
        varchar logoUrl
        varchar websiteUrl
        integer displayOrder
        boolean isActive
        timestamp createdAt
    }
```

## Key Relationships Explained

### MVP Phase 1 Core Relationships:
1. **User → ChallengeSubmission** (1:N): Users can submit many challenges
2. **User → PlayerStats** (1:1): Each user has one stats record per sport
3. **User ← Venue** (1:N): User can be king of multiple venues
4. **Venue → Challenge** (1:N): Each venue has multiple challenges
5. **Challenge → ChallengeSubmission** (1:N): Each challenge receives many submissions

### MVP Phase 2 Relationships:
1. **User → Avatar** (1:1): Each user has one avatar
2. **Avatar → AvatarEquipment** (1:N): One avatar, multiple sport loadouts
3. **User ↔ Venue** (M:N via ActivePlayer): Users can play at multiple venues

### Future Enhancement Relationships:
1. **Sport → Everything**: Sport becomes the central organizing entity
2. **User → Equipment** (M:N via UserEquipment): Users unlock many items
3. **Ranking Tables**: Separate optimized tables for venue/city/country rankings
4. **ChallengeTemplate → Challenge** (1:N): Reusable challenge definitions

## Cardinality Legend:
- `||--o{` : One to Many (1:N)
- `||--o|` : One to Zero-or-One (1:0..1)
- `||--||` : One to One (1:1)
- `}o--o{` : Many to Many (M:N)

## View Online:
Copy the Mermaid code blocks into:
- GitHub (auto-renders in .md files)
- https://mermaid.live (for interactive editing)
- VS Code with Mermaid extension
