# TDD Development Plan - Beat the Kingz MVP

**Approach:** Test-Driven Development (TDD) with Next.js
**Methodology:** Write test → See it fail → Write code → See it pass → Refactor → Commit

---

## Development Phases & Status Tracker

### Phase 0: Project Setup 🔄
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 0.1 | Initialize Next.js project with TypeScript | - | ✅ | `chore: initialize Next.js project with TypeScript` |
| 0.2 | Set up ESLint, Prettier, Husky | - | ✅ | Included in 0.1 |
| 0.3 | Install testing libraries (Jest, React Testing Library) | - | 🔄 | `chore: setup testing infrastructure` |
| 0.4 | Configure Tailwind CSS | - | ✅ | Included in 0.1 |
| 0.5 | Set up GitHub repository and push | - | ✅ | `docs: initial documentation and data model` |
| 0.6 | Install Prisma and PostgreSQL dependencies | - | ✅ | Included in 0.1 |
| 0.7 | Create .env files and example | - | ✅ | Included in 0.1 |

### Phase 1: Database & Models ⏳
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 1.1 | Write Prisma schema tests | ✅ | ⏳ | `test: add Prisma schema validation tests` |
| 1.2 | Create Prisma schema (6 MVP tables) | - | ⏳ | `feat: add Prisma schema for MVP tables` |
| 1.3 | Write database connection tests | ✅ | ⏳ | `test: add database connection tests` |
| 1.4 | Set up database connection | - | ⏳ | `feat: configure database connection` |
| 1.5 | Run first migration | - | ⏳ | `chore: initial database migration` |
| 1.6 | Write seed data tests | ✅ | ⏳ | `test: add seed data tests` |
| 1.7 | Create seed script | - | ⏳ | `feat: add database seed script` |

### Phase 2: Authentication Flow (Pages 1-2) ⏳
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 2.1 | Write email validation utility tests | ✅ | ⏳ | `test: add email validation tests` |
| 2.2 | Create email validation utility | - | ⏳ | `feat: implement email validation` |
| 2.3 | Write verification code generation tests | ✅ | ⏳ | `test: add verification code generation tests` |
| 2.4 | Create verification code generator | - | ⏳ | `feat: implement verification code generator` |
| 2.5 | Write API route tests for /api/auth/send-verification | ✅ | ⏳ | `test: add send verification endpoint tests` |
| 2.6 | Create /api/auth/send-verification endpoint | - | ⏳ | `feat: add send verification API endpoint` |
| 2.7 | Write API route tests for /api/auth/verify-code | ✅ | ⏳ | `test: add verify code endpoint tests` |
| 2.8 | Create /api/auth/verify-code endpoint | - | ⏳ | `feat: add verify code API endpoint` |
| 2.9 | Write Page 1 component tests (email input) | ✅ | ⏳ | `test: add email verification page tests` |
| 2.10 | Create Page 1 UI (email input) | - | ⏳ | `feat: implement email verification page` |
| 2.11 | Write Page 2 component tests (code input) | ✅ | ⏳ | `test: add code verification page tests` |
| 2.12 | Create Page 2 UI (code verification) | - | ⏳ | `feat: implement code verification page` |

### Phase 3: User Registration (Pages 3-4) ⏳
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 3.1 | Write age group calculation tests | ✅ | ⏳ | `test: add age group calculation tests` |
| 3.2 | Create age group calculator | - | ⏳ | `feat: implement age group calculator` |
| 3.3 | Write user registration validation tests | ✅ | ⏳ | `test: add user registration validation tests` |
| 3.4 | Create registration validation schemas | - | ⏳ | `feat: add registration validation schemas` |
| 3.5 | Write API tests for /api/users/register | ✅ | ⏳ | `test: add user registration endpoint tests` |
| 3.6 | Create /api/users/register endpoint | - | ⏳ | `feat: implement user registration endpoint` |
| 3.7 | Write Page 3 component tests | ✅ | ⏳ | `test: add registration form page tests` |
| 3.8 | Create Page 3 UI (registration form) | - | ⏳ | `feat: implement registration form page` |
| 3.9 | Write file upload tests | ✅ | ⏳ | `test: add profile picture upload tests` |
| 3.10 | Implement file upload to cloud storage | - | ⏳ | `feat: add cloud storage integration` |
| 3.11 | Write Page 4 component tests | ✅ | ⏳ | `test: add profile photo page tests` |
| 3.12 | Create Page 4 UI (photo upload) | - | ⏳ | `feat: implement profile photo page` |

### Phase 4: Main Hub & Avatar (Pages 5-6) ⏳
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 4.1 | Write onboarding status tests | ✅ | ⏳ | `test: add onboarding status tests` |
| 4.2 | Create onboarding status checker | - | ⏳ | `feat: implement onboarding status logic` |
| 4.3 | Write feature unlock tests | ✅ | ⏳ | `test: add feature unlock tests` |
| 4.4 | Implement feature unlock logic | - | ⏳ | `feat: add progressive feature unlock` |
| 4.5 | Write Page 5 component tests | ✅ | ⏳ | `test: add main hub page tests` |
| 4.6 | Create Page 5 UI (main hub) | - | ⏳ | `feat: implement main hub page` |
| 4.7 | Write avatar data model tests | ✅ | ⏳ | `test: add avatar data model tests` |
| 4.8 | Create avatar API endpoints | - | ⏳ | `feat: add avatar API endpoints` |
| 4.9 | Write Page 6 component tests | ✅ | ⏳ | `test: add avatar creation page tests` |
| 4.10 | Create Page 6 UI (avatar creation) | - | ⏳ | `feat: implement avatar creation page` |

### Phase 5: Venues & Map (Page 8) ⏳
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 5.1 | Write geolocation utility tests | ✅ | ⏳ | `test: add geolocation utility tests` |
| 5.2 | Create geolocation utilities | - | ⏳ | `feat: implement geolocation utilities` |
| 5.3 | Write distance calculation tests | ✅ | ⏳ | `test: add distance calculation tests` |
| 5.4 | Implement PostGIS distance queries | - | ⏳ | `feat: add PostGIS distance calculations` |
| 5.5 | Write API tests for /api/venues/nearby | ✅ | ⏳ | `test: add nearby venues endpoint tests` |
| 5.6 | Create /api/venues/nearby endpoint | - | ⏳ | `feat: implement nearby venues endpoint` |
| 5.7 | Write map component tests | ✅ | ⏳ | `test: add interactive map tests` |
| 5.8 | Implement interactive map | - | ⏳ | `feat: add interactive venue map` |

### Phase 6: Challenges (Pages 7, 9) ⏳
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 6.1 | Write challenge status tests | ✅ | ⏳ | `test: add challenge status tests` |
| 6.2 | Create challenge status logic | - | ⏳ | `feat: implement challenge status tracking` |
| 6.3 | Write API tests for challenges endpoints | ✅ | ⏳ | `test: add challenges API tests` |
| 6.4 | Create challenges API endpoints | - | ⏳ | `feat: add challenges API endpoints` |
| 6.5 | Write Page 7 component tests | ✅ | ⏳ | `test: add challenges list page tests` |
| 6.6 | Create Page 7 UI (challenges list) | - | ⏳ | `feat: implement challenges list page` |
| 6.7 | Write tutorial component tests | ✅ | ⏳ | `test: add tutorial section tests` |
| 6.8 | Create tutorial section | - | ⏳ | `feat: add tutorial section` |

### Phase 7: Challenge Recording (Page 10) ⏳
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 7.1 | Write countdown timer tests | ✅ | ⏳ | `test: add countdown timer tests` |
| 7.2 | Create countdown timer component | - | ⏳ | `feat: implement countdown timer` |
| 7.3 | Write video recording tests | ✅ | ⏳ | `test: add video recording tests` |
| 7.4 | Implement video recording | - | ⏳ | `feat: add video recording capability` |
| 7.5 | Write submission validation tests | ✅ | ⏳ | `test: add submission validation tests` |
| 7.6 | Create submission validation | - | ⏳ | `feat: implement submission validation` |
| 7.7 | Write API tests for submission | ✅ | ⏳ | `test: add challenge submission tests` |
| 7.8 | Create submission endpoint | - | ⏳ | `feat: add challenge submission endpoint` |
| 7.9 | Write results display tests | ✅ | ⏳ | `test: add results display tests` |
| 7.10 | Create results display | - | ⏳ | `feat: implement results display` |

### Phase 8: Rankings & Stats (Page 7) ⏳
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 8.1 | Write XP calculation tests | ✅ | ⏳ | `test: add XP calculation tests` |
| 8.2 | Create XP calculation logic | - | ⏳ | `feat: implement XP calculations` |
| 8.3 | Write ranking algorithm tests | ✅ | ⏳ | `test: add ranking algorithm tests` |
| 8.4 | Implement ranking algorithms | - | ⏳ | `feat: add ranking algorithms` |
| 8.5 | Write King of Venue tests | ✅ | ⏳ | `test: add King of Venue logic tests` |
| 8.6 | Create King of Venue logic | - | ⏳ | `feat: implement King of Venue system` |
| 8.7 | Write API tests for rankings | ✅ | ⏳ | `test: add rankings API tests` |
| 8.8 | Create rankings endpoints | - | ⏳ | `feat: add rankings API endpoints` |
| 8.9 | Write rankings page tests | ✅ | ⏳ | `test: add rankings page tests` |
| 8.10 | Create rankings UI | - | ⏳ | `feat: implement rankings page` |

### Phase 9: Integration & Polish ⏳
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 9.1 | Write E2E tests for full user flow | ✅ | ⏳ | `test: add E2E user journey tests` |
| 9.2 | Fix integration issues | - | ⏳ | `fix: resolve integration issues` |
| 9.3 | Write performance tests | ✅ | ⏳ | `test: add performance benchmarks` |
| 9.4 | Optimize performance | - | ⏳ | `perf: optimize database queries and rendering` |
| 9.5 | Add loading states | - | ⏳ | `feat: add loading and error states` |
| 9.6 | Add animations | - | ⏳ | `feat: add UI animations and transitions` |

### Phase 10: Deployment ⏳
| Step | Task | Test First | Status | Commit Message |
|------|------|------------|--------|----------------|
| 10.1 | Write deployment tests | ✅ | ⏳ | `test: add deployment validation tests` |
| 10.2 | Configure CI/CD pipeline | - | ⏳ | `chore: add GitHub Actions CI/CD` |
| 10.3 | Set up staging environment | - | ⏳ | `chore: configure staging environment` |
| 10.4 | Deploy to staging | - | ⏳ | `chore: deploy to staging` |
| 10.5 | Run smoke tests | - | ⏳ | `test: run staging smoke tests` |
| 10.6 | Deploy to production | - | ⏳ | `chore: deploy to production` |

---

## Git Workflow

### Branch Strategy
```bash
main
├── develop
│   ├── feature/phase-0-setup
│   ├── feature/phase-1-database
│   ├── feature/phase-2-auth
│   ├── feature/phase-3-registration
│   ├── feature/phase-4-avatar
│   ├── feature/phase-5-venues
│   ├── feature/phase-6-challenges
│   ├── feature/phase-7-recording
│   ├── feature/phase-8-rankings
│   └── feature/phase-9-integration
```

### Commit Convention
```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- test: Adding tests
- chore: Build/config changes
- docs: Documentation
- perf: Performance improvements
- refactor: Code refactoring
```

### TDD Cycle for Each Step
```bash
# 1. Write failing test
npm test -- --watch

# 2. See test fail (RED)
# 3. Write minimal code to pass
# 4. See test pass (GREEN)
# 5. Refactor if needed (REFACTOR)
# 6. Commit
git add .
git commit -m "type: description"

# 7. Push after each phase
git push origin feature/phase-X
```

---

## Testing Strategy

### Unit Tests
- All utilities and helpers
- Database models and queries
- API route handlers
- React components

### Integration Tests
- API endpoints with database
- Authentication flow
- File upload flow
- Challenge submission flow

### E2E Tests
- Complete user registration
- Challenge participation
- Ranking updates

### Test Coverage Goals
- Overall: 80%+
- Critical paths: 95%+
- Utilities: 100%

---

## Example TDD Implementation

### Step 2.1-2.2: Email Validation
```typescript
// 1. Write test first (email.test.ts)
describe('Email Validation', () => {
  test('should validate correct email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  test('should reject invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false);
  });
});

// 2. Run test - see it fail
// 3. Write implementation (email.ts)
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 4. Run test - see it pass
// 5. Commit
git add .
git commit -m "feat: implement email validation"
```

---

## Status Legend
- ⏳ Not Started
- 🔄 In Progress
- ✅ Completed
- ❌ Blocked
- 🔍 In Review

---

## Daily Development Process

1. **Morning**
   - Review current phase status
   - Pick next uncompleted step
   - Write tests for that step

2. **Development**
   - Follow TDD cycle
   - Commit after each green test
   - Update status in this document

3. **End of Day**
   - Push all commits
   - Update overall progress
   - Note any blockers

---

## Success Criteria

- [ ] All tests passing (100%)
- [ ] Test coverage > 80%
- [ ] No console errors
- [ ] Lighthouse score > 90
- [ ] All 10 pages functional
- [ ] Database migrations clean
- [ ] Deployment successful

---

**Total Steps:** 95
**Completed:** 0
**Progress:** 0%

**Next Step:** Initialize Next.js project (Step 0.1)