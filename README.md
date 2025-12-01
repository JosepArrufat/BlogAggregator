# Blog Aggregator

A TypeScript-based RSS feed aggregator that allows users to follow feeds and view the latest posts in a personalized timeline.

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **PostgreSQL** (running locally or accessible via connection string)
- **npm** or **yarn** package manager

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

The application uses PostgreSQL with Drizzle ORM. Make sure PostgreSQL is running and create a database for the application.

### 3. Configuration

Create or verify your `drizzle.config.ts` file in the root directory:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "src/schema.ts",
  out: "src/lib/db",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://username:password@localhost:5432/your_database_name",
  },
});
```

Replace the connection URL with your actual PostgreSQL credentials and database name.

### 4. Database Migration

Push the schema to your database:

```bash
npx drizzle-kit push
```

## Running the Application

The application provides a CLI interface with various commands:

```bash
npm run start <command> [options]
```

### Available Commands

#### User Management

- **Register a new user:**
  ```bash
  npm run start register <username>
  ```

- **Login:**
  ```bash
  npm run start login <username>
  ```

#### Feed Management

- **Add a new feed:**
  ```bash
  npm run start addfeed <feed_name> <feed_url>
  ```

- **Follow an existing feed:**
  ```bash
  npm run start follow <feed_url>
  ```

- **List feeds:**
  ```bash
  npm run start feeds
  ```

#### Content Aggregation

- **Start background aggregation:**
  ```bash
  npm run start agg <interval>
  ```
  Example: `npm run start agg 30s` (aggregates every 30 seconds)
  
  Press `Ctrl+C` to stop the aggregation process gracefully.

- **Browse latest posts:**
  ```bash
  npm run start browse [limit]
  ```
  Example: `npm run start browse 10` (shows 10 latest posts)

## How It Works

1. **User Registration**: Create an account to start following feeds
2. **Feed Management**: Add RSS/Atom feeds and follow them
3. **Background Aggregation**: The system periodically fetches new posts from followed feeds
4. **Personalized Timeline**: View the latest posts from all your followed feeds

## Development

The application is built with:

- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** for data storage
- **fast-xml-parser** for RSS/Atom feed parsing

### Project Structure

```
src/
├── schema.ts          # Database schema definitions
├── config.ts          # Application configuration
├── index.ts           # Main CLI entry point
├── commands.ts        # Command handlers
├── fetch.ts           # RSS feed fetching logic
└── lib/
    └── db/
        ├── index.ts   # Database connection
        └── queries/   # Database query functions
```

### Database Schema

The application uses four main tables:
- `users` - User accounts
- `feeds` - RSS/Atom feeds
- `feed_follows` - User-feed relationships
- `posts` - Aggregated posts from feeds

## Troubleshooting

- **Database connection issues**: Verify your PostgreSQL credentials in `drizzle.config.ts`
- **Schema issues**: Run `npx drizzle-kit push` to sync your schema
- **Feed parsing errors**: Check that the RSS/Atom feed URL is valid and accessible

## License

MIT License