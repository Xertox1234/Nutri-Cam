# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NutriScan is a mobile nutrition tracking app built with Expo/React Native (frontend) and Express.js (backend). Users scan food barcodes/labels with their camera, track nutritional intake, and receive AI-powered nutrition advice via chat.

## Development Commands

```bash
# Start development (run both in parallel)
npm run server:dev    # Express backend on port 3000
npm run expo:dev      # Expo frontend with tunneling

# Database
npm run db:push       # Push Drizzle schema to PostgreSQL

# Code quality
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run check:types   # TypeScript type check
npm run format        # Prettier formatting

# Testing
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report

# Production build
npm run server:build  # Bundle server with esbuild → server_dist/
npm run expo:static:build  # Build static Expo bundle
```

## Architecture

### Monorepo Structure

- `client/` - React Native/Expo frontend
- `server/` - Express.js backend
- `shared/` - Code shared between client/server (database schema, models)

### Path Aliases

- `@/` → `./client`
- `@shared/` → `./shared`

### Frontend Stack

- **Expo SDK 54** with React Native 0.81, React 19
- **Navigation**: React Navigation v7 (native-stack + bottom-tabs)
- **State**: TanStack Query v5 for server state, React Context for auth/onboarding
- **Styling**: StyleSheet with custom theme system (`client/constants/theme.ts`)
- **Animations**: Reanimated 4

### Backend Stack

- **Express.js 5** with TypeScript
- **Drizzle ORM** with PostgreSQL
- **Session-based auth** with bcrypt

### Navigation Flow

1. **Login** → 2. **Onboarding** (6 screens) → 3. **Main App** (3 tabs: History, Scan, Profile)

Modal screens: NutritionDetailScreen, ItemDetailScreen

### Database Schema (`shared/schema.ts`)

Key tables: `users`, `userProfiles` (dietary preferences), `scannedItems`, `dailyLogs`, `conversations`/`messages`

### AI Integration (`server/`)

- `chat/` - OpenAI nutrition assistant with user dietary context
- `audio/` - Speech-to-text, text-to-speech
- `image/` - Image generation
- `batch/` - Rate-limited LLM batch processing

## Key Patterns

**CRITICAL:** Follow established patterns in `docs/PATTERNS.md` for all code changes. This ensures consistency, prevents common issues, and maintains code quality across the project.

### Pattern Documentation

- **`docs/PATTERNS.md`** - Comprehensive development patterns covering:
  - TypeScript patterns (type guards, shared types, Express extensions)
  - API patterns (error responses, auth, fail-fast validation)
  - Client state patterns (in-memory caching, Authorization headers, 401 handling)
  - Performance patterns (storage optimization, batching)
  - React Native patterns (safe areas, haptics, platform-specific code)
  - Camera patterns (expo-camera, scan debouncing, permissions)
  - Documentation patterns (todos, design decisions)

**Before implementing:** Check if a pattern exists. **After implementing:** Consider if your solution should become a pattern.

### Quick Pattern Reference

#### API Calls

Client uses `apiRequest()` from `client/lib/query-client.ts` for all server communication with automatic error handling. Always use Authorization header (not cookies) for auth tokens.

#### Theming

Use `useTheme()` hook. Colors, spacing, typography defined in `client/constants/theme.ts`. Supports light/dark modes.

#### Authentication

`AuthContext` manages auth state with AsyncStorage persistence. `useAuth()` hook provides login/register/logout. Token stored via in-memory cached storage (`client/lib/token-storage.ts`).

#### Onboarding

`OnboardingContext` collects dietary info across 6 screens. Data saved to `userProfiles` table on completion.

#### Safe Areas (React Native)

Always use `useSafeAreaInsets()` for screen layouts to handle iOS notch/dynamic island. Add theme spacing for visual breathing room.

#### Camera Scanning

Debounce barcode scans using ref tracking and `isScanning` state to prevent duplicate triggers. Always provide haptic feedback on successful scan.

## Testing

Unit tests use **Vitest** with tests co-located in `__tests__/` directories:

- `server/__tests__/` - Auth middleware, route validation, storage interface
- `client/lib/__tests__/` - Query client, token storage utilities
- `shared/__tests__/` - Zod schemas, type guards

**Pre-commit hooks** (via Husky) automatically run on every commit:

1. `npm run test:run` - All tests must pass
2. `lint-staged` - ESLint + Prettier on staged files

If tests fail or linting errors occur, the commit is blocked.

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection
- `SESSION_SECRET` - Express session key
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Custom OpenAI endpoint
- `EXPO_PUBLIC_DOMAIN` - Public API domain for mobile client
