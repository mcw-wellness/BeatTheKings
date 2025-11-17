# Beat the Kingz - Project Structure

## Directory Structure

```
src/
├── app/
│   ├── (auth)/                    # Authentication & Onboarding Routes
│   │   ├── login/                 # Main login/landing page
│   │   │   └── page.tsx
│   │   ├── register/              # User registration
│   │   │   └── page.tsx
│   │   ├── verify/                # Email verification
│   │   │   └── page.tsx
│   │   └── photo/                 # Photo upload
│   │       └── page.tsx
│   │
│   ├── (app)/                     # Protected Main App Routes
│   │   ├── welcome/               # Main dashboard
│   │   │   └── page.tsx
│   │   ├── avatar/                # Avatar creator
│   │   │   └── page.tsx
│   │   ├── ranking/               # Rankings (Venue/City/Country)
│   │   │   └── page.tsx
│   │   ├── map/                   # Venue map
│   │   │   └── page.tsx
│   │   ├── challenges/            # Challenges list
│   │   │   └── page.tsx
│   │   └── challenge/             # Challenge details
│   │       └── [id]/
│   │           ├── page.tsx       # Challenge instructions
│   │           ├── record/        # Challenge recording
│   │           │   └── page.tsx
│   │           └── results/       # Challenge results
│   │               └── page.tsx
│   │
│   ├── api/                       # API Routes
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   │
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
│
├── components/
│   ├── layout/                    # Layout Components
│   │   ├── Logo.tsx
│   │   ├── SessionProvider.tsx
│   │   └── SignOutButton.tsx
│   │
│   └── ui/                        # Base UI Components
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
│
├── context/                       # React Context
│   └── AppContext.tsx
│
├── hooks/                         # Custom React Hooks
│   └── useAuth.ts
│
├── types/                         # TypeScript Type Definitions
│   └── index.ts
│
└── utils/                         # Utility Functions & Services
    ├── mockData.ts
    └── utils.ts
```

## Route Groups Explanation

### (auth) Group
- Contains all authentication and onboarding pages
- Users navigate through: Login → Register → Verify → Photo
- These routes are public and accessible before login

### (app) Group
- Contains all protected main application pages
- Requires user to be authenticated
- Main flow: Welcome → Avatar → Rankings/Map/Challenges

## Import Path Changes

All imports now use the new structure:

```typescript
// Components
import { Logo } from '@/components/layout/Logo';
import { SessionProvider } from '@/components/layout/SessionProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Utils
import { mockData } from '@/utils/mockData';
import { formatXP } from '@/utils/utils';

// Context & Hooks
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';

// Types
import type { User, Avatar } from '@/types';
```

## Benefits of This Structure

1. **Clear Separation**: Auth routes vs App routes are visually separated
2. **Scalability**: Easy to add new pages to appropriate groups
3. **Component Organization**: Layout vs UI components are clearly separated
4. **Consistency**: Follows Next.js App Router best practices
5. **Maintainability**: Easier to locate and update files

## Next Steps

- Add middleware for route protection in `(app)` group
- Create shared layouts for each route group
- Consider adding more utility modules in `utils/`
