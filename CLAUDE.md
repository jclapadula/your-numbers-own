# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal budgeting application called "Your Numbers" with a full-stack architecture:

- **Backend**: Express.js API server using Bun runtime with TypeScript
- **Frontend**: React Router v7 application with TypeScript and TailwindCSS
- **Database**: PostgreSQL with Kysely query builder and type-safe migrations

## Development Commands

### Root Level (Full Stack)

```bash
# Start both frontend and backend in development mode
bun dev

# Type check both applications
bun check
```

### Backend (`/backend`)

```bash
# Start backend development server with debugger
bun dev

# Database operations
bun run db:create      # Create new migration
bun run db:migrate     # Run migrations
bun run db:generate    # Generate TypeScript types from schema

# Run backend only
bun run index.ts
```

### Frontend (`/frontend`)

```bash
# Development server
bun dev

# Build for production
bun run build

# Type checking with React Router codegen
bun run typecheck

# Start production server
bun start
```

## Architecture Overview

### Database Schema

The application uses a PostgreSQL database with the following core entities:

- **Users**: Auth0 authenticated users with timezone settings
- **Budgets**: User-owned budget containers with timezone support
- **Accounts**: Bank accounts within budgets
- **CategoryGroups** & **Categories**: Hierarchical expense/income categorization
- **Transactions**: Financial transactions linked to accounts and categories
- **MonthlyCategoryBudgets**: Monthly budget allocations per category
- **AccountPartialBalances** & **BudgetMonthlyBalances**: Computed balance aggregations

### Backend Structure

- `/src/api/`: Express.js routes and middleware
- `/src/services/`: Business logic and data access layer
- `/src/db/`: Database configuration, migrations, and generated types
- Database types are auto-generated using `kysely-codegen`

### Frontend Structure

- `/app/api/`: HTTP client and API layer
- `/app/components/`: React components organized by feature
- `/app/routes/`: React Router pages
- Uses React Query for server state management
- TailwindCSS + DaisyUI for styling
- HeroIcons for icons

## Key Technical Patterns

### Database Considerations

- **CategoryId nullability**: The `categoryId` column can be null - use appropriate null-safe comparisons in queries (not just `=`)
- **Timezone handling**: Budgets have timezone settings for proper date calculations
- **Balance calculations**: Account and budget balances are computed and stored in separate tables

### Type Safety

- Backend and frontend maintain separate but similar type definitions in `models.ts` files
- Database schema changes require running `bun run db:generate` to update TypeScript types
- Frontend API models use string dates while backend uses Date objects

### Authentication

- Uses Auth0 for authentication with `express-oauth2-jwt-bearer` middleware
- Users are identified by external Auth0 IDs

## Common Development Tasks

### Adding New Database Fields

1. Create migration: `cd backend && bun run db:create`
2. Write migration in `/backend/src/db/migrations/`
3. Run migration: `bun run db:migrate`
4. Generate types: `bun run db:generate`
5. Update service layer types in both frontend and backend `models.ts`

### Adding New API Endpoints

1. Add route handler in `/backend/src/api/routers/`
2. Add corresponding client function in `/frontend/app/api/`
3. Create React Query hooks in appropriate `/frontend/app/components/*/Queries.ts`

## Important Notes

- Uses Bun as the JavaScript runtime instead of Node.js
- Database operations use Kysely for type-safe queries
- Frontend uses React Router v7 with file-based routing
- Drag-and-drop functionality for category management using `@dnd-kit`
