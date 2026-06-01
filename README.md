# Team Task Tracker

A full-stack task management application with RBAC, real-time notifications, and caching.

## Features
- **Authentication:** JWT with Access + Refresh token rotation.
- **RBAC:** Middleware-level enforcement (ADMIN, MANAGER, MEMBER).
- **Task Management:** CRUD with strict server-side status transitions.
- **Caching:** Redis-backed task lists per assignee.
- **Real-time:** Socket.io notifications for status changes and assignments.
- **Analytics:** Data aggregation for overdue tasks and completion efficiency.
- **Frontend:** Premium Next.js dashboard with Kanban board.

## Tech Stack
- **Backend:** Node.js, Express, Prisma, PostgreSQL, Redis, Socket.io, Zod.
- **Frontend:** Next.js 15+, Tailwind CSS, Lucide Icons, Axios.
- **Infrastructure:** Docker, Docker Compose.

## Design Decisions
1. **Middleware-based RBAC:** I implemented an `authorize` middleware that keeps the role-checking logic modular and separate from controllers.
2. **Prisma Indexes:** Added indexes on `status`, `assigneeId`, and `dueDate` to optimize common filtering and overdue analytics queries.
3. **Redis Caching:** Applied caching specifically to the task list fetching for `MEMBER` roles, as this is the most frequent query. Invalidation happens automatically on any update to that assignee's tasks.
4. **Status Transitions:** Enforced a strict state machine for status flows (e.g., TODO -> IN_PROGRESS only) to ensure data integrity.

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (if running locally)

## How to Run

### Using Docker (Recommended)
1. Clone the repository and navigate to the root directory.
2. Run the following command:
   ```bash
   docker-compose up --build
   ```
3. Access the application:
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **API:** [http://localhost:5000](http://localhost:5000)

### Manual Setup (Local)
1. **Backend:**
   - `cd backend`
   - `npm install`
   - Configure `.env` (copy from `.env.example`).
   - `npx prisma generate`
   - `npm run dev`
2. **Frontend:**
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Bonus Features Implemented
- [x] **Frontend:** Full-featured React/Next.js dashboard.
- [x] **Analytics:** Dedicated page & API for overdue metrics and efficiency tracking.
- [x] **Real-time Notifications:** Instant status change alerts via Socket.io.
- [x] **Unit Tests:** Validated status transition logic using Jest.

## Future Improvements
- **Drag & Drop:** Implement dnd-kit for the Kanban board columns.
- **Audit Logs:** Track who changed what task at what time.
- **Bulk Operations:** Allow managers to bulk-assign or bulk-delete tasks.
