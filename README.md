# Clove

An AI-powered tool that analyzes GitHub repository issues, classifies their difficulty, and generates step-by-step solutions to help beginners contribute to open source projects.

## Features

- Scan GitHub repositories and fetch open issues
- AI-powered issue analysis and difficulty classification
- Vector-based codebase understanding using embeddings
- Step-by-step solution generation for contributors

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (metadata), Qdrant (vector embeddings)
- **APIs**: OpenAI (GPT-4o, text-embedding-3-small), GitHub GraphQL API
- **State Management**: TanStack Query

## Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd clove
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/main
OPENAI_API_KEY=sk-proj-your-key-here
GITHUB_TOKEN=your-github-token
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Required API Keys:**

#### OpenAI API Key
Get from [OpenAI Platform](https://platform.openai.com/api-keys)

#### GitHub Token
Create at [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/peronal-access-tokens)

**Option 1: Fine-grained Token (Recommended)**
1. Go to [Fine-grained tokens](https://github.com/settings/personal-access-tokens)
2. Click "Generate new token"
3. Set token name and expiration
4. Under "Repository access", select:
   - "Public Repositories (read-only)" OR
   - "Only select repositories" (choose specific repos you want to analyze)
5. Under "Repository permissions", set:
   - **Contents**: Read-only (required for reading code)
   - **Issues**: Read-only (required for fetching issues)
   - **Metadata**: Read-only (automatically included)
6. Click "Generate token" and copy it

**Option 2: Classic Token**
1. Go to [Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set note and expiration
4. Select scopes:
   - **`public_repo`** (for public repositories only) OR
   - **`repo`** (if you need access to private repositories)
5. Click "Generate token" and copy it

#### Qdrant API Key
Set any value for local development (e.g., `local-dev-key`)

### 3. Start Docker Services

```bash
docker-compose up -d
```

This starts PostgreSQL and Qdrant containers.

### 4. Run Database Migrations

```bash
pnpm drizzle-kit push
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Project Structure

```
app/
  api/              # API routes
  repository/       # Repository and issue pages
components/         # React components
lib/
  ai/               # AI clients and generators
  db/               # Database schema and client
  github/           # GitHub API integration
  vector/           # Qdrant vector operations
  indexing/         # Code chunking and indexing
```
