Clove

A web application that scans GitHub repository (user input link), analyzes issues, classifies their difficulty, and provides step-by-step solutions for beginners to contribute to open source projects easy issues.
Tech Stack
Frontend

    Next.js 15 (App Router)

    TypeScript

    Tailwind CSS + shadcn/ui

    React Query (TanStack Query) for data fetching and caching

Backend

    Next.js Route Handlers (route.ts files)

    Node.js 20+

Database & Storage

    PostgreSQL (for metadata, issues, solutions)

    Qdrant (vector database for code embeddings)

Background Jobs

    QStash (Upstash CLI for local development)

APIs & Services

    GitHub GraphQL API for repo and issues data

    Vercel AI SDK for LLM interactions

    OpenAI API (GPT-4o for generation, text-embedding-3-small for embeddings)

Development Environment

    Docker & Docker Compose for local development

    All services containerized
