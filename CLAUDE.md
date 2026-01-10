# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Personal budgeting application "Your Numbers" - Full-stack TypeScript application:

- **Backend**: Express.js + Bun runtime
- **Frontend**: React Router v7 + TailwindCSS + DaisyUI
- **Database**: PostgreSQL + Kysely (type-safe queries)
- **Auth**: Passport.js with session-based authentication

## Development Commands

### Full Stack
```bash
bun dev          # Start both frontend and backend
bun check        # Type check both applications
```

### Database Operations (from `/backend`)
```bash
bun run db:create      # Create new migration
bun run db:migrate     # Run migrations
bun run db:generate    # Generate TypeScript types from schema
```

### Database Access
```bash
psql postgresql://local:localpass@localhost:5432/your-numbers
```

## Database Schema

Core entities:
- **Users** → **Budgets** → **Accounts** → **Transactions**
- **CategoryGroups** → **Categories** (hierarchical categorization)
- **MonthlyCategoryBudgets**: Budget allocations per category
- **AccountPartialBalances** & **BudgetMonthlyBalances**: Computed balances
- **Sessions**: PostgreSQL-stored sessions for auth persistence

## Key Technical Patterns

### Database Considerations

- **CategoryId nullability**: `categoryId` can be null - use null-safe comparisons in queries (not just `=`)
- **Soft deletion**: Accounts use `deletedAt` timestamp
  - Always filter: `WHERE deletedAt IS NULL`
  - Include filter when joining transactions with accounts
  - Category operations clean up transactions from soft-deleted accounts (set `categoryId` to null)
- **Timezone handling**: Budgets have timezone settings for date calculations
- **Balance calculations**: Computed and stored in separate tables (not calculated on-the-fly)
- **Authorization**: The `authorizeRequest` middleware validates that route entities (budgetId, accountId, etc.) belong to the authenticated user

### Type Safety

- Backend and frontend maintain separate `models.ts` files with similar types
- Database schema changes require `bun run db:generate` to update TypeScript types
- Frontend uses string dates, backend uses Date objects

## Common Development Tasks

### Adding Database Fields

1. `cd backend && bun run db:create` - Create migration
2. Write migration in `/backend/src/db/migrations/`
3. `bun run db:migrate` - Run migration
4. `bun run db:generate` - Generate TypeScript types
5. Update `models.ts` in both frontend and backend

### Adding API Endpoints

1. Add route handler in `/backend/src/api/routers/`
2. Add client function in `/frontend/app/api/`
3. Create React Query hooks in `/frontend/app/components/*/Queries.ts`

## Code Style Guidelines

### Extract Conditions into Named Variables

Extract complex boolean expressions into descriptive variables instead of putting them directly in `if` statements:

```typescript
// Good: Named variable provides semantic meaning
const isDestinationAccountChanging = destinationAccountId !== transfer.destinationAccountId;
if (isDestinationAccountChanging) {
  // ...
}

// Avoid: Condition lacks context
if (destinationAccountId !== transfer.destinationAccountId) {
  // ...
}
```

### Extract Functions Instead of Comments

When you need a comment to explain code, extract that code into a well-named function instead. The function name becomes living documentation that stays in sync with the code:

```typescript
// Good: Self-documenting function name
async function validateDestinationAccountOwnership(accountId: number, budgetId: number) {
  const account = await db
    .selectFrom('accounts')
    .where('id', '=', accountId)
    .where('budgetId', '=', budgetId)
    .executeTakeFirst();

  if (!account) {
    throw new Error('Destination account not found');
  }
}

await validateDestinationAccountOwnership(destinationAccountId, budgetId);

// Avoid: Explanatory comment for inline code
// Validate that the destination account exists and belongs to the budget
const account = await db
  .selectFrom('accounts')
  .where('id', '=', destinationAccountId)
  .where('budgetId', '=', budgetId)
  .executeTakeFirst();
```

Benefits: Better readability, testability, reusability, and maintenance. Comments become outdated; function names don't.

## Working with User Modifications

**CRITICAL**: When the user modifies code that you previously created, you MUST preserve their changes. Never overwrite or remove user modifications when making subsequent edits to the same file.

- Always read the current file state before making edits
- Identify and preserve any user changes made since your last edit
- If you need to modify code the user has changed, ask for clarification first
- The user's modifications take precedence over your original implementation
