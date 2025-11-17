# Beat the Kingz - MVP Clickthrough Prototype

Location-based sports competition platform where players compete at local venues, complete video challenges, earn XP, and compete for the title of "King."

## 🎯 Project Status

**✅ COMPLETE** - All 10 pages implemented and ready for deployment!

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Docker Build

```bash
# Build Docker image
docker build -t beatthekingz .

# Run container
docker run -p 3000:3000 beatthekingz

# Open http://localhost:3000
```

### Deploy to Azure

```bash
# One-command deployment
./deploy-azure.sh
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📱 Application Flow

### Onboarding (Pages 1-4)
1. **Email Verification** - Enter email, receive verification code
2. **Code Verification** - 6-digit code input
3. **Profile Registration** - Name, age, gender, location (auto-calculates age group)
4. **Profile Photo** - Upload or capture photo

### Main App (Pages 5-10)
5. **Welcome Hub** - Feature unlock system (avatar required)
6. **Avatar Creation** - Customize appearance, hair, jersey number, sport selection
7. **Rankings** - View top 10 players by Venue/City/Country
8. **Interactive Map** - Find venues with active players and King indicators
9. **Challenges** - Browse and start challenges by sport
10. **Challenge Flow** - Instructions → 10s countdown → Record → Results with XP

## 🏗️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** React Context API
- **Deployment:** Docker + Azure

## 📊 Data Model

Fully aligned with MVP database schema:
- ✅ User (with age groups, no face recognition)
- ✅ Venue (sport-agnostic: basketball, soccer, running, cycling, skiing)
- ✅ Challenge (with flexible parameters)
- ✅ ChallengeSubmission (video + performance data)
- ✅ PlayerStats (per sport)
- ✅ UserChallengeStatus (progress tracking)

See [DATA_MODEL.md](./DATA_MODEL.md) for complete schema.

## 🎨 Key Features

### Progressive Feature Unlock
- Create avatar to unlock Rankings, Map, and Challenges
- Visual lock indicators
- Smooth unlock animations

### Sport Selection
- Basketball 🏀
- Soccer ⚽
- Running 🏃
- Cycling 🚴
- Skiing ⛷️

### Challenge System
- 10-second countdown
- Video recording interface
- Try again / Upload options
- Performance tracking (shots, time, accuracy)
- XP rewards

### Rankings
- Three-tier system (Venue/City/Country)
- Top 10 lists
- Monthly challenges
- King of the Venue indicators (crown)

### Interactive Map
- Venue markers with active player counts
- Sport filtering
- King indicators
- Distance calculations

## 📁 Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── page.tsx           # Page 1: Email
│   ├── verify/            # Page 2: Code
│   ├── register/          # Page 3: Profile
│   ├── photo/             # Page 4: Photo
│   ├── welcome/           # Page 5: Hub
│   ├── avatar/            # Page 6: Avatar
│   ├── ranking/           # Page 7: Rankings
│   ├── map/               # Page 8: Map
│   ├── challenges/        # Page 9: Challenges
│   └── challenge/[id]/    # Page 10: Challenge flow
├── components/            # Reusable components
│   ├── ui/               # Button, Input, Card, Badge
│   └── Logo.tsx          # Pulsing logo
├── context/              # React Context
│   └── AppContext.tsx    # Global state
├── lib/
│   ├── mockData.ts       # Mock data (aligned with schema)
│   └── utils.ts          # Helper functions
└── types/
    └── index.ts          # TypeScript types (from Prisma)
```

## 🔧 Development Principles

- **KISS** - Keep it simple
- **YAGNI** - Build only what's needed now
- **TDD** - Test-driven development (when backend added)
- **Database Safety** - All schema changes require approval

## 📝 Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guidelines for future Claude instances
- [DATA_MODEL.md](./DATA_MODEL.md) - Complete database schema with MVP phases
- [ER_DIAGRAM.md](./ER_DIAGRAM.md) - Visual entity relationships
- [PRD_NEXTJS_MVP.md](./PRD_NEXTJS_MVP.md) - Product requirements
- [TDD_DEVELOPMENT_PLAN.md](./TDD_DEVELOPMENT_PLAN.md) - Implementation roadmap
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Azure deployment guide
- [CLICKTHROUGH_PLAN.md](./CLICKTHROUGH_PLAN.md) - Prototype implementation plan

## 🎮 Mock Data

All data is client-side mock data:
- No backend API calls
- No database connections
- Forms store in Context/State
- Email verification accepts any 6-digit code
- Video "uploads" are mock

**Ready for backend integration!**

## 🚀 Next Steps (Post-Clickthrough)

1. Add Azure PostgreSQL database
2. Implement Prisma migrations
3. Create API routes for data operations
4. Add Azure Blob Storage for videos/images
5. Implement email verification service
6. Add video AI verification
7. Set up PostGIS for geospatial queries
8. Add authentication (JWT/NextAuth)

## 💰 Azure Cost Estimate

- **App Service B1:** ~$13/month
- **Container Registry:** ~$5/month
- **Total:** ~$18/month for clickthrough prototype

## 📊 GitHub Repository

**https://github.com/kaza/BeatTheKings**

All code is committed and pushed!

## 📞 Support

For issues or questions, check:
- GitHub Issues
- Documentation files
- Azure deployment logs

---

**Built with Claude Code** 🤖

Co-Authored-By: Claude <noreply@anthropic.com>