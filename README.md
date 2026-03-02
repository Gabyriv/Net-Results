# Net Results — Volleyball Statistics App

A full-stack volleyball statistics tracking system that enables managers to create teams, manage players, track live games, and analyze performance metrics.

> **Refactoring Note:** This codebase is actively being converted from a web app (Vue.js frontend + Next.js backend) into a **mobile app**. This document captures the current web architecture as a reference for that migration.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Features](#features)
  - [Authentication & Authorization](#authentication--authorization)
  - [Team Management](#team-management)
  - [Player Management](#player-management)
  - [Game Management](#game-management)
  - [Player Statistics Tracking](#player-statistics-tracking)
  - [Dashboard & Analytics](#dashboard--analytics)
  - [Live Game Tracking](#live-game-tracking)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [State Management](#state-management)
- [UI Components](#ui-components)
- [How Features Connect](#how-features-connect)
- [Environment Variables](#environment-variables)
- [External Integrations](#external-integrations)
- [Security](#security)
- [Mobile Refactoring Notes](#mobile-refactoring-notes)

---

## Project Overview

**Net Results** is a volleyball team management and statistics platform. It targets coaches, team managers, and players who want to track real-time game performance.

**Core capabilities:**
- Role-based access (Manager vs. Player)
- Team and roster management
- Live game scoring with set-by-set tracking
- Per-player action recording (serve, pass, set, attack, block, dig)
- Dashboard with win rates, match history, and performance charts

---

## Tech Stack

### Frontend (`/public`)
| Layer | Technology |
|---|---|
| Framework | Vue.js 3.5 |
| Routing | Vue Router 4 |
| State | Pinia 3 |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 |
| HTTP | Axios |
| Charts | Chart.js 4 |
| Auth client | Supabase JS SDK |

### Backend (`/backend`)
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Runtime | Node.js |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Auth | Supabase Auth + NextAuth.js |
| Validation | Zod |
| Password hashing | bcryptjs |
| Language | TypeScript 5 |

---

## Repository Structure

```
Net-Results/
├── public/                         # Vue.js frontend
│   ├── src/
│   │   ├── assets/                 # Images, fonts
│   │   ├── components/             # Reusable Vue components
│   │   │   └── stats/              # Stat-specific components
│   │   ├── composable/             # Vue 3 composables (business logic)
│   │   ├── config/                 # Supabase client config
│   │   ├── layouts/                # Page layout wrappers
│   │   ├── pages/                  # Page-level route components
│   │   ├── router/                 # Vue Router + auth guards
│   │   ├── store/                  # Pinia stores
│   │   ├── styles/                 # Global CSS
│   │   ├── utils/                  # Helper functions + tests
│   │   ├── App.vue                 # Root component
│   │   └── main.js                 # Entry point
│   ├── vite.config.js
│   └── package.json
│
├── backend/                        # Next.js API backend
│   ├── src/
│   │   ├── app/
│   │   │   └── api/                # API route handlers
│   │   │       ├── auth/           # Login, logout, validate, reset
│   │   │       ├── games/          # Game CRUD + player stats
│   │   │       ├── players/        # Player CRUD + stats
│   │   │       ├── teams/          # Team CRUD + roster
│   │   │       └── users/          # User registration
│   │   ├── config/
│   │   ├── types/                  # TypeScript type definitions
│   │   └── utils/
│   │       ├── auth-utils.ts       # withAuth(), checkRole(), token extraction
│   │       ├── supabase/           # Supabase server/client helpers
│   │       └── logger.ts
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── migrations/
│   └── package.json
│
└── package.json                    # Root (monorepo scripts)
```

---

## Features

### Authentication & Authorization

**Files:** `backend/src/app/api/auth/`, `public/src/composable/useAuth.js`, `public/src/router/index.js`

#### Registration flow
1. User submits email, password, display name, and role (`Manager` or `Player`)
2. Zod validates the input (email format, password min 6 chars)
3. Account created in **Supabase Auth** (email confirmation auto-skipped in dev)
4. User row inserted into Prisma (`User` table)
5. A `Manager` or `Player` record is created depending on the selected role

#### Login flow
1. User submits credentials → Supabase authenticates
2. User data fetched from Prisma
3. JWT access token issued (7-day expiration)
4. Token stored in `localStorage` and an `httpOnly` cookie
5. Frontend router guard reads token on every protected route navigation

#### Session management
- `useAuth.js` composable owns all auth state
- Token validation calls `GET /api/auth/validate` with a **30-second client-side cache** to avoid redundant network calls
- On logout: localStorage cleared, cookies cleared, Pinia state reset, redirect to `/login`

#### Role-based access
| Action | Manager | Player |
|---|---|---|
| Create teams | ✅ | ❌ |
| Manage players | ✅ | ❌ |
| Create games | ✅ | ❌ |
| View own stats | ✅ | ✅ |
| View team info | ✅ | ✅ |

#### Route guards
Routes with `meta: { requiresAuth: true }` redirect unauthenticated users to `/login`. Authenticated users hitting `/login` or `/register` are redirected to `/teams`.

---

### Team Management

**Files:** `backend/src/app/api/teams/`, `public/src/composable/useTeams.js`, `public/src/pages/Teams.vue`, `public/src/pages/TeamDetails.vue`

- Managers create teams; each team belongs to one manager
- Players are assigned to a team via the team's roster endpoint
- Bulk player addition processes batches of 5 with 100ms delays to avoid overloading the DB
- Deleting a team cascades to remove player associations
- A manager can own multiple teams; a player belongs to at most one team at a time

**Key API endpoints:**
```
GET    /api/teams                  List teams (filtered by owner if applicable)
POST   /api/teams                  Create team (Manager only)
GET    /api/teams/:id              Get team details
PUT    /api/teams/:id              Update team
DELETE /api/teams/:id              Delete team (cascades players)
POST   /api/teams/:id/players      Add players to team (bulk supported)
GET    /api/teams/:id/roster       Get full team roster
```

---

### Player Management

**Files:** `backend/src/app/api/players/`, `public/src/composable/usePlayers.js`, `public/src/pages/Players.vue`

- Players are created as full user accounts (email + password auto-generated if needed)
- Players have an optional jersey number
- `gamesPlayed` is tracked on the `Player` model
- Unassigned players can be fetched separately to populate team roster pickers

**Key API endpoints:**
```
GET    /api/players                List all players (filter: unassigned)
POST   /api/players                Create player + user account
GET    /api/players/:id            Get player details
PUT    /api/players/:id            Update name / jersey number
DELETE /api/players/:id            Delete player
GET    /api/players/:id/stats      Summary stats
GET    /api/players/:id/statistics Detailed stats per game
```

---

### Game Management

**Files:** `backend/src/app/api/games/`, `public/src/composable/useGames.js`, `public/src/pages/Matches.vue`

- Games are created by authenticated users (typically Managers)
- Supports Best-of-3 or Best-of-5 set formats (`maxSets`)
- `setScores` and `setsWon` stored as JSON blobs for flexibility
- `isActive` flag marks in-progress games
- `servingTeam` enum tracks who is serving (`Home` | `Away`)
- Games are scoped to the creating user (`userId` FK)

**Key API endpoints:**
```
GET    /api/games                  All games
GET    /api/games/my-games         Games created by authenticated user
POST   /api/games/create           Create game
GET    /api/games/:id              Game details
PUT    /api/games/:id              Update scores, sets, status
DELETE /api/games/:id              Delete game + player stats
GET    /api/games/:id/player-stats Player stats for a game
POST   /api/games/:id/player-stats Record a single stat
POST   /api/games/:id/player-stats/batch  Record stats in bulk
```

---

### Player Statistics Tracking

**Files:** `backend/src/app/api/games/[id]/player-stats/`, `public/src/components/stats/`

Each recorded action links a **player**, **game**, and **team**, and captures:

| Field | Values |
|---|---|
| `statType` | `SERVE`, `PASS`, `SET`, `ATTACK`, `BLOCK`, `DIG` |
| `quality` | `+` (point/ace), `=` (neutral/in-play), `-` (error) |
| `value` | Integer count |

Stats are recorded in real-time during live game tracking and can also be submitted in batches after the fact.

**Stats components pipeline:**
```
ActionPopup.vue       (user picks stat type: Serve, Attack, etc.)
    ↓
ResultPopup.vue       (user picks quality: +, =, -)
    ↓
POST /api/games/:id/player-stats
    ↓
PlayerStats row inserted in DB
    ↓
PlayerStatsDisplay.vue / PlayerStatsSummary.vue (refreshed)
```

---

### Dashboard & Analytics

**Files:** `public/src/pages/Dashboard.vue`, `public/src/store/`, `public/src/utils/calculateStats.js`

The dashboard fetches data from `GET /api/games/my-games` and computes:
- **Total matches played**
- **Win rate** (%)
- **Total wins**
- **Performance chart** — last 10 games rendered as a bar chart via Chart.js (wins green, losses red)

All stat calculations live in `calculateStats.js` so they can be unit-tested independently of the UI.

---

### Live Game Tracking

**Files:** `public/src/pages/VolleyballScoring.vue`, `public/src/pages/GameTrackingPage.vue`, `public/src/components/VolleyballScoreboard.vue`

This is the most complex part of the frontend (~62KB component).

**Flow:**
```
Manager navigates to /volleyball-scoring/:id
→ Game loaded (GET /api/games/:id)
→ Scoreboard displayed with set scores + serving indicator
→ Manager taps a player
→ ActionPopup opens (stat type selection)
→ ResultPopup opens (quality selection)
→ Stat POSTed to /api/games/:id/player-stats
→ UI updates score / serves / set count
→ Set win auto-detected (score threshold reached)
→ Match win auto-detected (sets won threshold reached)
→ Game marked inactive
```

**Scoreboard state tracked locally:**
- Current set number (`currentSet`)
- Points per set per team (`setScores`)
- Sets won per team (`setsWon`)
- Serving team (`servingTeam`)

---

## Data Models

Full Prisma schema is at `backend/prisma/schema.prisma`.

```
User
 ├── id, email, password, displayName
 ├── role: Manager | Player
 ├── → Manager (1:1)
 ├── → Player (1:1)
 └── → Game[] (created games)

Manager
 ├── id, displayName
 ├── → User (1:1)
 └── → Team[] (owned teams)

Team
 ├── id, name
 ├── → Manager (owner)
 ├── → Player[] (roster)
 └── → PlayerStats[]

Player
 ├── id, displayName, gamesPlayed, number (jersey)
 ├── → User (1:1)
 ├── → Team (current team, nullable)
 └── → PlayerStats[]

Game
 ├── id, created_at, game (label), season
 ├── myTeam, myPts, oppTeam, oppPts
 ├── sets, maxSets, setScores (JSON), setsWon (JSON)
 ├── isActive, currentSet
 ├── servingTeam: Home | Away
 ├── → User (creator)
 └── → PlayerStats[]

PlayerStats
 ├── id, statType, value, quality, createdAt
 ├── → Player
 ├── → Game
 └── → Team

Enums: Role, ServingTeam, StatType
```

---

## API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/validate` | Validate token |
| POST | `/api/auth/reset-password` | Request password reset |
| GET | `/api/auth/confirm-email` | Confirm email address |

### Users
| Method | Path | Description |
|---|---|---|
| POST | `/api/users` | Register user |
| GET | `/api/users` | List users (Manager only) |

### Teams
| Method | Path | Description |
|---|---|---|
| GET | `/api/teams` | List teams |
| POST | `/api/teams` | Create team |
| GET | `/api/teams/:id` | Get team |
| PUT | `/api/teams/:id` | Update team |
| DELETE | `/api/teams/:id` | Delete team |
| POST | `/api/teams/:id/players` | Add players |
| GET | `/api/teams/:id/roster` | Get roster |

### Players
| Method | Path | Description |
|---|---|---|
| GET | `/api/players` | List players |
| POST | `/api/players` | Create player |
| GET | `/api/players/:id` | Get player |
| PUT | `/api/players/:id` | Update player |
| DELETE | `/api/players/:id` | Delete player |
| GET | `/api/players/:id/stats` | Summary stats |
| GET | `/api/players/:id/statistics` | Detailed stats |

### Games
| Method | Path | Description |
|---|---|---|
| GET | `/api/games` | All games |
| GET | `/api/games/my-games` | User's games |
| POST | `/api/games/create` | Create game |
| GET | `/api/games/:id` | Get game |
| PUT | `/api/games/:id` | Update game |
| DELETE | `/api/games/:id` | Delete game |
| GET | `/api/games/:id/player-stats` | Game player stats |
| POST | `/api/games/:id/player-stats` | Record stat |
| POST | `/api/games/:id/player-stats/batch` | Batch record stats |

### Utility
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/debug` | Debug info (dev only) |

---

## State Management

### Pinia stores (`public/src/store/`)
| Store | Responsibility |
|---|---|
| `useMainStore` | Shared matches + players state, `fetchDashboardData()` |
| `matchStore.js` | Match-specific state |
| `playstore.js` | Player-specific state |

### Composables (`public/src/composable/`)
Composables own the actual API calls and business logic. Components import composables rather than calling APIs directly.

| Composable | Owns |
|---|---|
| `useAuth.js` | Login, logout, register, token cache, role checks |
| `useTeams.js` | Team CRUD, batch player addition |
| `usePlayers.js` | Player CRUD, team assignments |
| `useGames.js` | Game CRUD, score updates |
| `useMatches.js` | Match-level operations |

---

## UI Components

### Pages (`public/src/pages/`)
| Component | Route | Auth |
|---|---|---|
| `Home.vue` | `/home` | No |
| `Login.vue` | `/login` | No |
| `Register.vue` | `/register` | No |
| `Dashboard.vue` | `/dashboard` | Yes |
| `Teams.vue` | `/teams` | Yes |
| `TeamDetails.vue` | `/teams/:id` | Yes |
| `Players.vue` | `/players` | Yes |
| `Matches.vue` | `/matches` | Yes |
| `Statistics.vue` | `/statistics` | Yes |
| `VolleyballScoring.vue` | `/volleyball-scoring/:id` | Yes |
| `GameTrackingPage.vue` | `/game-tracking` | Yes |
| `GameStats.vue` | `/games/:id/stats` | Yes |
| `PlayerStats.vue` | `/player/:id/stats` | Yes |

### Shared components (`public/src/components/`)
`Navbar`, `Footer`, `Button`, `StatCard`, `PlayerCard`, `MatchTable`, `LoadingSpinner`, `LineChart`, `VolleyballScoreboard`, `CourtDisplay`, `PlayerSquares`

### Stats components (`public/src/components/stats/`)
`ActionPopup`, `ResultPopup`, `PlayerStatForm`, `PlayerStatsTracker`, `PlayerStatsDisplay`, `PlayerStatsSummary`, `PlayerStatsChart`, `StatisticRow`

### Layouts (`public/src/layouts/`)
`DefaultLayout.vue` — wraps most pages with Navbar
`DashboardLayout.vue` — dashboard-specific shell

---

## How Features Connect

### Team setup workflow
```
Register as Manager
→ Manager record auto-created (POST /api/users)
→ Create team (POST /api/teams)
→ Create / add players (POST /api/players or POST /api/teams/:id/players)
→ Players appear in team roster (GET /api/teams/:id/roster)
```

### Live game workflow
```
Create game (POST /api/games/create)
→ Navigate to /volleyball-scoring/:id
→ VolleyballScoreboard loads game state
→ Tap player → ActionPopup → ResultPopup
→ POST /api/games/:id/player-stats
→ Score + stat display updates
→ Set/match completion auto-detected
→ Game marked inactive (PUT /api/games/:id)
```

### Analytics workflow
```
Dashboard mounts
→ fetchDashboardData() in Pinia store
→ GET /api/games/my-games
→ calculateStats.js computes win rate, totals
→ Chart.js renders performance bar chart
```

### Auth + routing connection
```
App mounts → useAuth.js checks localStorage
→ If token found → GET /api/auth/validate (30s cache)
→ Valid: user state set in Pinia
→ Invalid: clear state, redirect /login

Vue Router beforeEach guard
→ requiresAuth routes: check auth state
→ Unauthenticated → /login
→ Authenticated on /login or /register → /teams
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=              # Prisma connection (pooled)
DIRECT_URL=                # Prisma direct connection (migrations)
NODE_ENV=development
```

### Frontend (`public/.env`)
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## External Integrations

### Supabase
- Handles user registration, login, email confirmation, and password reset
- JWT tokens issued by Supabase, validated server-side
- Used in both frontend (`supabase_client.js`) and backend (`utils/supabase/`)
- In development, email confirmation is auto-approved

### PostgreSQL via Prisma
- All application data (users, teams, players, games, stats) lives here
- `DATABASE_URL` uses connection pooling; `DIRECT_URL` is used for migrations
- Schema defined in `backend/prisma/schema.prisma`

### Chart.js
- Renders win/loss performance charts on the Dashboard
- Wrapped in `LineChart.vue` component

---

## Security

| Concern | Approach |
|---|---|
| Password storage | bcryptjs hashing |
| Auth tokens | httpOnly cookies + localStorage |
| Protected routes | `withAuth()` HOF wraps all sensitive handlers |
| Role enforcement | `checkRole()` utility on Manager-only endpoints |
| Input validation | Zod schemas on all user inputs |
| HTTP headers | CSP, X-Frame-Options, X-Content-Type-Options via Next.js config |
| CORS | Configured in Next.js middleware |
| Data isolation | Users query only their own games/teams |

---

## Mobile Refactoring Notes

This section exists to guide the conversion from the current web architecture to a mobile app.

### What maps cleanly
| Web Layer | Mobile Equivalent |
|---|---|
| Vue composables (`useAuth`, `useTeams`, etc.) | Service/hook layer — logic is already decoupled from UI |
| Pinia stores | Zustand / Redux / MobX / Jotai |
| Axios API calls | Same API calls, same base URLs |
| Vue Router routes | React Navigation / Expo Router stacks |
| Tailwind utility classes | NativeWind (if using React Native + Tailwind) or StyleSheet |
| Chart.js in LineChart.vue | Victory Native / react-native-chart-kit |

### Backend: no changes needed
The Next.js API backend is fully decoupled from the frontend. The mobile app simply replaces the Vue frontend — all API endpoints remain as-is.

### Biggest UI components to rewrite
1. **`VolleyballScoreboard.vue`** (~62KB) — the live scoring interface is the most complex screen; plan it carefully as it manages local set/score state and drives stat recording
2. **`Dashboard.vue`** — depends on Chart.js, needs chart library swap
3. **`ActionPopup.vue` / `ResultPopup.vue`** — modal flows that will become native bottom sheets or modals

### Auth on mobile
- Replace `localStorage` token storage with `SecureStore` (Expo) or `AsyncStorage`
- Replace httpOnly cookies with bearer tokens in request headers
- The `/api/auth/validate` endpoint and 30-second cache pattern can remain identical

### Key data flows to preserve
- The `statType` + `quality` pattern for recording player actions is clean — preserve it exactly
- Batch stat recording (`/player-stats/batch`) is useful for offline-first support
- `isActive` + `currentSet` + `setScores` game state model is well-suited for mobile local state
