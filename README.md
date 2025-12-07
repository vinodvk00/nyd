# Time Tracking Analytics Platform

A full-stack time tracking analytics platform that integrates with Toggl Track API, stores data in PostgreSQL, and provides interactive visualizations through a modern web dashboard.

## Overview

This project helps you gain deeper insights into your time tracking data by syncing entries from Toggl Track to a local database and providing six comprehensive analytics views:

- **Summary Statistics** - Total hours, sessions, averages, and active projects
- **Project Breakdown** - Time distribution across projects with percentages
- **Activity Timeline** - Daily/weekly/monthly trends visualization
- **Hourly Patterns** - Identify your most productive hours
- **Trend Analysis** - Period-over-period comparisons
- **Top Projects** - Ranked list of projects by time investment

## Features

### Backend (NestJS)
- Real-time Toggl Track API integration
- PostgreSQL database for local analytics storage
- Automatic project synchronization
- 6 comprehensive analytics endpoints
- RESTful API with full CRUD operations
- Handles 3-month historical data limit from Toggl

### Frontend (Next.js 16)
- Modern, responsive analytics dashboard
- Interactive charts with Tremor React
- Dark mode support
- Real-time data updates with SWR
- Smooth animations with Framer Motion
- Beautiful UI components from Shadcn/ui

## Architecture

```
┌─────────────────┐
│   Toggl Track   │ (External API)
│      API v9     │
└────────┬────────┘
         │
         │ Sync & Fetch
         │
┌────────▼────────┐      ┌──────────────┐
│  NestJS Backend │◄────►│  PostgreSQL  │
│   (Port 3000)   │      │   Database   │
└────────┬────────┘      └──────────────┘
         │
         │ REST API
         │
┌────────▼────────┐
│  Next.js Frontend│
│   (Port 3001)   │
└─────────────────┘
```

### Technology Stack

**Backend:**
- NestJS 11.x - TypeScript framework
- TypeORM 0.3.x - Database ORM
- PostgreSQL - Data storage
- Axios - HTTP client
- Toggl Track API v9

**Frontend:**
- Next.js 16 - React framework with App Router
- React 19 - UI library
- TypeScript 5 - Type safety
- Shadcn/ui - General UI components
- Tremor React - Analytics charts
- TailwindCSS v4 - Styling
- SWR - Data fetching & caching
- Framer Motion - Animations
- next-themes - Dark mode

## Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18.x or higher
- **PostgreSQL** 12.x or higher
- **Toggl Track Account** with API token ([Get it here](https://track.toggl.com/profile))

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nyd
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create PostgreSQL database
createdb time_tracking_db
# OR using psql: CREATE DATABASE time_tracking_db;

# Create .env file
cat > .env << EOF
PORT=3000
NODE_ENV=development

TOGGL_API_TOKEN=your_toggl_api_token_here
TOGGL_WORKSPACE_ID=your_workspace_id_here

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=time_tracking_db
EOF

# Start development server
npm run start:dev
```

Backend will be running at `http://localhost:3000`

### 3. Setup Frontend

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Start development server
npm run dev
```

Frontend will be running at `http://localhost:3001`

### 4. Sync Your Data

After both servers are running, sync your Toggl data:

```bash
# Using curl
curl -X POST "http://localhost:3000/tracks/sync"

# Or visit the dashboard and use the sync button
```

### 5. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3001
```

## Project Structure

```
nyd/
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── app.module.ts      # Root module (ConfigModule + TypeORM + TracksModule)
│   │   ├── main.ts            # Application entry point
│   │   └── tracks/            # Feature module
│   │       ├── tracks.module.ts
│   │       ├── tracks.controller.ts    # Toggl API + CRUD endpoints
│   │       ├── tracks.service.ts       # Business logic
│   │       ├── analytics.controller.ts # Analytics endpoints
│   │       ├── analytics.service.ts    # Analytics calculations
│   │       ├── entities/
│   │       │   ├── track.entity.ts
│   │       │   └── project.entity.ts
│   │       └── dto/
│   ├── .env                   # Environment variables (create this)
│   ├── package.json
│   ├── README.md             # Backend documentation
│   └── BACKEND_ANALYTICS_PLAN.md  # API specifications
│
├── frontend/                  # Next.js frontend application
│   ├── app/
│   │   ├── layout.tsx        # Root layout with providers
│   │   ├── page.tsx          # Home page/dashboard
│   │   └── globals.css       # Global styles + theme
│   ├── components/
│   │   └── ui/               # Shadcn/ui components
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   ├── .env.local            # Environment variables (create this)
│   ├── .npmrc                # NPM config for React 19 compatibility
│   ├── package.json
│   ├── README.md             # Frontend documentation
│   └── FRONTEND_ANALYTICS_PLAN.md  # Dashboard implementation plan
│
└── README.md                  # This file
```

## Configuration

### Backend Environment Variables

Create `backend/.env` with the following:

```env
# Server
PORT=3000
NODE_ENV=development

# Toggl API
TOGGL_API_TOKEN=<your_token>        # From https://track.toggl.com/profile
TOGGL_WORKSPACE_ID=<workspace_id>   # From Toggl workspace settings

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=<your_username>
DB_PASSWORD=<your_password>
DB_DATABASE=time_tracking_db
```

### Frontend Environment Variables

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Development Workflow

### Running Both Servers Concurrently

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Testing the API

```bash
# Get current running task
curl http://localhost:3000/tracks/toggl/current

# Sync Toggl data to database
curl -X POST http://localhost:3000/tracks/sync

# Get summary statistics
curl http://localhost:3000/tracks/stats/summary?period=week

# Get project breakdown
curl http://localhost:3000/tracks/stats/by-project

# Get activity timeline (daily)
curl "http://localhost:3000/tracks/stats/by-date?groupBy=day"

# Get hourly pattern
curl http://localhost:3000/tracks/stats/hourly-pattern

# Get trends (week-over-week hours)
curl "http://localhost:3000/tracks/stats/trends?metric=hours&period=week"

# Get top 5 projects
curl "http://localhost:3000/tracks/stats/top-projects?limit=5"
```

## Key Concepts

### How Toggl Sync Works

1. **Fetch Time Entries**: Backend retrieves time entries from Toggl API (up to 3 months historical)
2. **Project Resolution**: For each entry with a project_id:
   - Checks if project exists locally
   - If not, fetches project details from Toggl
   - Creates project record in PostgreSQL
3. **Track Creation/Update**: Uses `togglId` as unique identifier
   - New entries are created
   - Existing entries are updated
4. **Returns Statistics**: Total, created, updated, skipped, and any errors

### Analytics Calculation Methodology

**Duration Conversion:**
- Toggl stores duration in seconds
- Analytics endpoints convert to hours (rounded to 2 decimals)
- Running tasks have negative duration values

**Date Grouping:**
- Day: Groups by date (YYYY-MM-DD)
- Week: Groups by year and week number
- Month: Groups by year and month

**Trend Calculations:**
- Compares current period vs previous period
- Shows absolute change and percentage
- Supports hours or session count metrics

### Date Range Handling

- **Toggl API Limit**: Can only fetch data from last 3 months
- **Auto-adjustment**: Backend automatically adjusts start dates if too old
- **Analytics Default**: 30 days if no date range specified
- **Validation**: Ensures startDate < endDate

## API Endpoints Overview

### Toggl Integration
- `GET /tracks/toggl/current` - Current running task
- `GET /tracks/toggl` - All tasks from Toggl
- `POST /tracks/sync` - Sync to database

### Track CRUD
- `POST /tracks` - Create track
- `GET /tracks` - Get all tracks
- `GET /tracks/:id` - Get single track
- `GET /tracks/project/:projectName` - Filter by project
- `GET /tracks/date-range` - Date range query
- `GET /tracks/paginated` - Paginated results
- `PATCH /tracks/:id` - Update track
- `DELETE /tracks/:id` - Delete track

### Analytics
- `GET /tracks/stats/summary` - Summary statistics
- `GET /tracks/stats/by-project` - Project breakdown
- `GET /tracks/stats/by-date` - Activity timeline
- `GET /tracks/stats/hourly-pattern` - Hourly distribution
- `GET /tracks/stats/trends` - Trend analysis
- `GET /tracks/stats/top-projects` - Top projects ranking

For detailed API documentation, see [backend/README.md](backend/README.md)

## Documentation

### Detailed Guides

- **[Backend README](backend/README.md)** - Complete API documentation, setup, and troubleshooting
- **[Frontend README](frontend/README.md)** - UI/UX guide, component library usage, and styling
- **[Backend API Plan](backend/BACKEND_ANALYTICS_PLAN.md)** - Analytics endpoints specification
- **[Frontend Dashboard Plan](frontend/FRONTEND_ANALYTICS_PLAN.md)** - Dashboard implementation roadmap

### External Resources

- [Toggl Track API Documentation](https://developers.track.toggl.com/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tremor React Documentation](https://tremor.so/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com)

## Troubleshooting

### Common Full-Stack Issues

#### Backend can't connect to database

**Solution:**
- Ensure PostgreSQL is running: `pg_isready`
- Verify credentials in `backend/.env`
- Create database if missing: `createdb time_tracking_db`

#### Frontend can't fetch data from backend

**Error:** `Failed to fetch` or CORS error

**Solution:**
- Verify backend is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Configure CORS in `backend/src/main.ts`:
  ```typescript
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  ```

#### Toggl sync returns no data

**Solution:**
- Verify `TOGGL_API_TOKEN` and `TOGGL_WORKSPACE_ID` in backend `.env`
- Check you have time entries in Toggl for the requested period
- Remember: Toggl API only returns last 3 months of data

#### Frontend build fails

**Solution:**
- Ensure `.npmrc` exists in frontend with `legacy-peer-deps=true`
- Run `npm install` in frontend directory
- Check TypeScript types match backend API responses

### Port Conflicts

If ports 3000 or 3001 are in use:

**Backend:**
- Change `PORT` in `backend/.env`
- Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` accordingly

**Frontend:**
- Next.js will automatically use next available port
- Or specify port: `npm run dev -- -p 3002`

## Production Deployment

### Backend Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Disable TypeORM synchronize (`synchronize: false` in app.module.ts)
- [ ] Use TypeORM migrations for schema changes
- [ ] Configure production database connection
- [ ] Set up connection pooling
- [ ] Implement rate limiting
- [ ] Configure CORS for production frontend URL
- [ ] Use secure credential management (not .env files)
- [ ] Set up logging (Winston, etc.)
- [ ] Implement database backups

### Frontend Checklist

- [ ] Run `npm run build` to create production bundle
- [ ] Set production API URL in environment variables
- [ ] Configure proper caching strategies
- [ ] Optimize images with Next.js Image component
- [ ] Enable analytics and monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure CSP headers
- [ ] Implement proper SEO meta tags

## Development Scripts

### Backend

```bash
cd backend

npm run start:dev      # Development with hot reload
npm run build          # Build for production
npm run start:prod     # Run production build
npm run lint           # Lint code
npm run format         # Format with Prettier
npm run test           # Run unit tests
npm run test:e2e       # Run E2E tests
npm run test:cov       # Test coverage
```

### Frontend

```bash
cd frontend

npm run dev            # Development server
npm run build          # Production build
npm run start          # Start production server
npm run lint           # Lint code
```

## Contributing

When contributing to this project:

1. Follow existing code structure and naming conventions
2. Maintain TypeScript type safety
3. Update documentation for new features
4. Test both backend and frontend integration
5. Ensure no console errors or warnings

## Roadmap

**Potential Future Features:**

- [ ] User authentication and multi-user support
- [ ] Export analytics to CSV/PDF
- [ ] Custom date range picker with presets
- [ ] Email reports (daily/weekly summaries)
- [ ] Budget tracking per project
- [ ] Integration with other time tracking tools
- [ ] Mobile responsive improvements
- [ ] Offline mode support
- [ ] Real-time WebSocket updates
- [ ] Team analytics and collaboration features

## License

UNLICENSED - Private project

---

## Getting Help

For detailed information on specific aspects:

- **Backend API issues** → See [backend/README.md](backend/README.md)
- **Frontend UI issues** → See [frontend/README.md](frontend/README.md)

---

**Built with:** NestJS, Next.js, PostgreSQL, Toggl Track API, Tremor, and Shadcn/ui
