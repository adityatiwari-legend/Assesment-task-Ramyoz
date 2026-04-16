# Mini Kanban Board

A full-stack task management web application built with Next.js App Router, PostgreSQL, and secure cookie-based authentication.

## Live Deployment

https://assesment-task-ramyoz.vercel.app/

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Task Status Workflow](#task-status-workflow)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)

## Overview

Mini Kanban Board allows authenticated users to create, track, and manage tasks through three stages:

- Pending
- In Progress
- Completed

Each user has isolated data, and task operations are protected by server-side session checks.

## Features

- User registration and login with secure HTTP-only session cookies
- Per-user task isolation in PostgreSQL
- Task CRUD operations (create, read, update, delete)
- Drag and drop task movement with status transition validation
- Mobile quick-move buttons on task cards (Pending -> In Progress -> Completed)
- Responsive UI for desktop and mobile
- Optimistic UI updates with toast notifications
- Automatic database schema initialization on first request

## Tech Stack

- Framework: Next.js 16 (App Router)
- Runtime: React 19
- Language: TypeScript
- Styling: Tailwind CSS v4
- Database: PostgreSQL (pg)
- Authentication: JWT (jose) + HTTP-only cookies
- Password Hashing: bcryptjs
- Drag and Drop: dnd-kit
- Linting: ESLint 9 + eslint-config-next

## Architecture

- Frontend: Client and server components under src/app and src/components
- API: Route handlers under src/app/api
- Auth: JWT session token stored in HTTP-only cookie named session
- Data Layer: PostgreSQL connection pooling and schema bootstrap in src/lib/db.ts
- Authorization: All task routes validate the active session and scope queries by user_id

## Project Structure

```text
src/
	app/
		api/
			auth/
			tasks/
		login/
		register/
		layout.tsx
		page.tsx
	components/
		Board.tsx
		Column.tsx
		TaskCard.tsx
		TaskForm.tsx
		EditModal.tsx
		DeleteConfirmModal.tsx
		SearchBar.tsx
		ToastContainer.tsx
		AuthProvider.tsx
	lib/
		auth.ts
		db.ts
	types/
		task.ts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL instance

### 1. Clone and install dependencies

```bash
git clone https://github.com/adityatiwari-legend/Assesment-task-Ramyoz.git
cd "Assesment task Ramyoz"
npm install
```

### 2. Configure environment variables

Create a .env.local file in the project root:

```env
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
JWT_SECRET=replace-with-a-strong-random-secret
```

### 3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Environment Variables

| Variable    | Required             | Description                                 |
| ----------- | -------------------- | ------------------------------------------- |
| DB_HOST     | Yes                  | PostgreSQL host                             |
| DB_PORT     | Yes                  | PostgreSQL port (default 5432)              |
| DB_USER     | Yes                  | PostgreSQL username                         |
| DB_PASSWORD | Yes                  | PostgreSQL password                         |
| DB_NAME     | Yes                  | PostgreSQL database name                    |
| JWT_SECRET  | Strongly recommended | Secret used to sign and verify session JWTs |

Notes:

- The application currently enables SSL in the PostgreSQL pool config.
- For local non-SSL PostgreSQL setups, adjust src/lib/db.ts accordingly.

## Available Scripts

| Command       | Description              |
| ------------- | ------------------------ |
| npm run dev   | Start development server |
| npm run build | Create production build  |
| npm run start | Run production server    |
| npm run lint  | Run ESLint               |

## API Reference

### Auth Routes

| Method | Endpoint           | Description                          |
| ------ | ------------------ | ------------------------------------ |
| POST   | /api/auth/register | Register user and create session     |
| POST   | /api/auth/login    | Authenticate user and create session |
| GET    | /api/auth/me       | Get current authenticated user       |
| POST   | /api/auth/logout   | Clear active session                 |

### Task Routes

| Method | Endpoint       | Description                              |
| ------ | -------------- | ---------------------------------------- |
| GET    | /api/tasks     | List tasks for current user              |
| POST   | /api/tasks     | Create task for current user             |
| PUT    | /api/tasks/:id | Update title, description, and/or status |
| DELETE | /api/tasks/:id | Delete task                              |

All task routes require an authenticated session.

## Task Status Workflow

Allowed status transitions are enforced both in UI and API:

- pending -> in_progress
- in_progress -> completed
- completed -> no further transitions

## Deployment Notes

- Production deployment: https://assesment-task-ramyoz.vercel.app/
- Ensure production environment variables are configured in Vercel.
- Use a strong JWT_SECRET in production.

## Troubleshooting

### Database connection issues

- Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME.
- Confirm the database accepts SSL if using current pool defaults.

### Authentication issues

- Confirm JWT_SECRET is set and consistent across deployments.
- Clear browser cookies and retry login.

### Build and lint checks

Run:

```bash
npm run lint
npm run build
```
