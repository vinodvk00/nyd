# Time Tracking Backend API

A NestJS-based backend service that integrates with Toggl Track API and provides local PostgreSQL analytics for time tracking data.

## Overview

This backend serves as a bridge between Toggl Track API and a local analytics database. It provides:

- **Real-time Toggl API integration** - Fetch current and historical time entries directly from Toggl
- **Local database sync** - Persist Toggl data to PostgreSQL for advanced analytics
- **Analytics endpoints** - Generate insights and statistics from stored time tracking data
- **Automatic project management** - Syncs project information from Toggl workspace

## Tech Stack

- **Framework:** NestJS 11.x
- **Language:** TypeScript 5.x
- **ORM:** TypeORM 0.3.x
- **Database:** PostgreSQL
- **HTTP Client:** Axios
- **External API:** Toggl Track API v9

## Prerequisites

Before getting started, ensure you have:

- **Node.js** 18.x or higher
- **PostgreSQL** 12.x or higher installed and running
- **Toggl Track Account** with API token
  - Get your API token from [Toggl Profile Settings](https://track.toggl.com/profile)
  - Find your workspace ID from Toggl workspace settings

## Installation & Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Create a PostgreSQL database for the application:

```sql
CREATE DATABASE time_tracking_db;
```

### 4. Environment Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Toggl API Configuration
TOGGL_API_TOKEN=your_toggl_api_token_here
TOGGL_WORKSPACE_ID=your_workspace_id_here

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=time_tracking_db
```

**Note:** The application uses `synchronize: true` in development, which automatically creates/updates database tables based on entities. This should be disabled in production environments.

### 5. Start the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000` (or your configured PORT).

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server with hot reload |
| `npm run start:debug` | Start in debug mode with watch |
| `npm run build` | Build the application for production |
| `npm run start:prod` | Run production build |
| `npm run lint` | Lint and auto-fix TypeScript files |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:debug` | Debug tests with Node inspector |

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

Coverage reports are generated in the `coverage/` directory.

## API Documentation

### Base URL

```
http://localhost:8000
```

### Authentication

Currently, no authentication is required for API endpoints. Toggl API authentication is handled server-side using the configured API token.

---

### Toggl Integration Endpoints

#### Get Current Running Task

Fetches the currently active time entry from Toggl (if any).

```http
GET /tracks/toggl/current
```

**Response:** `200 OK`

```json
{
  "id": 12345678,
  "workspace_id": 9876543,
  "project_id": 111222333,
  "description": "Working on API documentation",
  "start": "2025-01-15T14:30:00Z",
  "duration": -1736952600,
  "stop": null
}
```

**Response:** `204 No Content` (when no task is running)

---

#### Get All Tasks from Toggl

Fetches time entries directly from Toggl API within a date range.

```http
GET /tracks/toggl?startDate=2025-01-01&endDate=2025-01-31
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (YYYY-MM-DD). Defaults to 3 months ago |
| `endDate` | string | No | End date (YYYY-MM-DD). Defaults to today |

**Note:** Toggl API has a 3-month historical data limit. Dates older than 3 months will be automatically adjusted.

**Response:** `200 OK`

```json
[
  {
    "id": 12345678,
    "workspace_id": 9876543,
    "project_id": 111222333,
    "description": "Backend development",
    "start": "2025-01-15T09:00:00Z",
    "stop": "2025-01-15T12:30:00Z",
    "duration": 12600
  }
]
```

---

#### Sync Toggl Data to Database

Syncs time entries from Toggl to the local PostgreSQL database.

```http
POST /tracks/sync?startDate=2025-01-01&endDate=2025-01-31
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (YYYY-MM-DD). Defaults to 3 months ago |
| `endDate` | string | No | End date (YYYY-MM-DD). Defaults to today |

**Process:**
1. Fetches time entries from Toggl within the date range
2. For each entry with a project, ensures the project exists locally
3. Fetches missing projects from Toggl API
4. Creates or updates track records using `togglId` as unique identifier
5. Returns sync statistics

**Response:** `201 Created`

```json
{
  "message": "Sync completed successfully",
  "stats": {
    "total": 150,
    "created": 45,
    "updated": 105,
    "skipped": 0,
    "errors": []
  }
}
```

---

### Track CRUD Endpoints

#### Create Track

```http
POST /tracks
Content-Type: application/json

{
  "togglId": 12345678,
  "description": "Backend API development",
  "start": "2025-01-15T09:00:00Z",
  "duration": 7200,
  "projectId": 111222333,
  "projectName": "Time Tracking App"
}
```

#### Get All Tracks

```http
GET /tracks
```

#### Get Track by ID

```http
GET /tracks/:id
```

#### Get Tracks by Project

```http
GET /tracks/project/:projectName
```

#### Get Tracks by Date Range

```http
GET /tracks/date-range?startDate=2025-01-01&endDate=2025-01-31
```

#### Get Paginated Tracks

```http
GET /tracks/paginated?page=1&limit=20
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

#### Update Track

```http
PATCH /tracks/:id
Content-Type: application/json

{
  "description": "Updated description"
}
```

#### Delete Track

```http
DELETE /tracks/:id
```

---

### Analytics Endpoints

All analytics endpoints return aggregated data from the local PostgreSQL database. Duration values are converted from seconds to hours (rounded to 2 decimals).

#### Get Summary Statistics

Returns overview statistics for a time period.

```http
GET /tracks/stats/summary?period=week
```

**Query Parameters:**

| Parameter | Type | Required | Options | Default |
|-----------|------|----------|---------|---------|
| `period` | string | No | `today`, `week`, `month`, `all` | `week` |

**Response:** `200 OK`

```json
{
  "totalHours": 120.50,
  "totalSessions": 45,
  "averageSessionDuration": 2.68,
  "activeProjects": 5,
  "period": "week"
}
```

---

#### Get Project Breakdown

Returns time distribution per project with percentages.

```http
GET /tracks/stats/by-project?startDate=2025-01-01&endDate=2025-01-31
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (YYYY-MM-DD). Defaults to 30 days ago |
| `endDate` | string | No | End date (YYYY-MM-DD). Defaults to today |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "projectName": "Time Tracking App",
      "totalHours": 45.50,
      "sessionCount": 15,
      "percentage": 37.76
    },
    {
      "projectName": "Client Portal",
      "totalHours": 32.25,
      "sessionCount": 12,
      "percentage": 26.77
    }
  ],
  "totalHours": 120.50
}
```

---

#### Get Activity by Date

Returns timeline data grouped by day, week, or month.

```http
GET /tracks/stats/by-date?startDate=2025-01-01&endDate=2025-01-31&groupBy=day
```

**Query Parameters:**

| Parameter | Type | Required | Options | Default |
|-----------|------|----------|---------|---------|
| `startDate` | string | No | YYYY-MM-DD | 30 days ago |
| `endDate` | string | No | YYYY-MM-DD | Today |
| `groupBy` | string | No | `day`, `week`, `month` | `day` |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "date": "2025-01-15",
      "totalHours": 8.50,
      "sessionCount": 4
    },
    {
      "date": "2025-01-16",
      "totalHours": 7.25,
      "sessionCount": 3
    }
  ],
  "groupBy": "day"
}
```

---

#### Get Hourly Pattern

Returns activity distribution by hour of day (0-23).

```http
GET /tracks/stats/hourly-pattern?startDate=2025-01-01&endDate=2025-01-31
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (YYYY-MM-DD). Defaults to 30 days ago |
| `endDate` | string | No | End date (YYYY-MM-DD). Defaults to today |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "hour": 9,
      "totalHours": 15.50,
      "sessionCount": 12
    },
    {
      "hour": 10,
      "totalHours": 18.75,
      "sessionCount": 15
    }
  ]
}
```

---

#### Get Trends

Returns period-over-period comparison for hours or sessions.

```http
GET /tracks/stats/trends?metric=hours&period=week
```

**Query Parameters:**

| Parameter | Type | Required | Options | Default |
|-----------|------|----------|---------|---------|
| `metric` | string | No | `hours`, `sessions` | `hours` |
| `period` | string | No | `week`, `month` | `week` |

**Response:** `200 OK`

```json
{
  "current": {
    "value": 42.50,
    "startDate": "2025-01-08T00:00:00.000Z",
    "endDate": "2025-01-15T00:00:00.000Z"
  },
  "previous": {
    "value": 38.25,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-08T00:00:00.000Z"
  },
  "change": {
    "absolute": 4.25,
    "percentage": 11.11
  },
  "metric": "hours",
  "period": "week"
}
```

---

#### Get Top Projects

Returns ranked projects by time spent.

```http
GET /tracks/stats/top-projects?limit=5&period=month
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 10 | Number of top projects to return |
| `period` | string | No | `month` | Time period (`week`, `month`, `all`) |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "projectName": "Time Tracking App",
      "totalHours": 85.50,
      "sessionCount": 32,
      "rank": 1
    },
    {
      "projectName": "Client Portal",
      "totalHours": 62.25,
      "sessionCount": 24,
      "rank": 2
    }
  ],
  "limit": 5,
  "period": "month"
}
```

---

## Data Models

### Track Entity

Represents a time tracking entry.

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Auto-generated primary key |
| `togglId` | number | Unique Toggl time entry ID |
| `description` | string | Task description |
| `start` | Date | Start timestamp |
| `duration` | number | Duration in seconds (null for running tasks) |
| `projectId` | number | Foreign key to Project |
| `projectName` | string | Denormalized project name for query performance |
| `createdAt` | Date | Record creation timestamp |
| `updatedAt` | Date | Record update timestamp |

**Relationships:**
- Many-to-one with Project entity

### Project Entity

Represents a Toggl project.

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Primary key (from Toggl project ID) |
| `name` | string | Project name |
| `description` | string | Project description (nullable) |
| `createdAt` | Date | Record creation timestamp |
| `updatedAt` | Date | Record update timestamp |

**Relationships:**
- One-to-many with Track entity

**Entity Relationship:**

```
Project (1) ──────< (Many) Track
   id                   projectId
```

---

## Key Features & Implementation Details

### Toggl Sync Process

The sync operation follows this workflow:

1. **Fetch Time Entries:** Retrieves time entries from Toggl API within the specified date range
2. **Project Resolution:** For each entry with a `project_id`:
   - Checks if the project exists in the local database
   - If not found, fetches project details from Toggl API: `GET /workspaces/{workspace_id}/projects/{project_id}`
   - Creates project record (or fallback project if fetch fails)
3. **Track Creation/Update:** Uses `togglId` as unique identifier to prevent duplicates
4. **Error Handling:** Collects errors during sync but continues processing. Returns up to 5 errors in response

### Toggl API Limitations

- **Historical Data:** Toggl API v9 can only fetch data from the last 3 months
- **Auto-adjustment:** Both `getAllTasks()` and `syncFromToggl()` automatically adjust start dates that exceed this limit
- **Date Format:** Dates are converted to ISO format (YYYY-MM-DD) for API requests

### Project Handling

- **Primary Keys:** Project IDs from Toggl are used directly as PostgreSQL primary keys
- **Fallback Creation:** If project fetch fails, creates a project with name "Project {id}"
- **Denormalization:** Both `projectId` and `projectName` are stored in Track entity for optimized queries

### Analytics Calculations

- **Duration Conversion:** All durations are converted from seconds to hours
- **Precision:** Hours are rounded to 2 decimal places
- **Default Date Ranges:** Analytics endpoints default to 30 days if dates not specified
- **Database Functions:** Uses PostgreSQL-specific functions (TO_CHAR, EXTRACT) for date grouping

### Error Handling

- **Development Mode:** Detailed error messages with stack traces
- **Production Mode:** Generic error messages without sensitive details
- **Logging:** Uses NestJS Logger for important operations and errors
- **Validation:** Date validation ensures `startDate < endDate`

---

## Architecture

### Module Structure

```
backend/
├── src/
│   ├── app.module.ts           # Root module (ConfigModule + TypeORM + TracksModule)
│   ├── main.ts                 # Application entry point
│   └── tracks/
│       ├── tracks.module.ts    # Feature module
│       ├── tracks.controller.ts
│       ├── tracks.service.ts
│       ├── analytics.controller.ts
│       ├── analytics.service.ts
│       ├── entities/
│       │   ├── track.entity.ts
│       │   └── project.entity.ts
│       └── dto/
│           └── create-track.dto.ts
└── test/
    └── app.e2e-spec.ts
```

### Service Layer Responsibilities

**TracksService:**
- Toggl API integration (current task, all tasks)
- Database synchronization
- CRUD operations for Track records
- Specialized queries (by project, date range, pagination)

**AnalyticsService:**
- Aggregated statistics (summary, trends)
- Project breakdown and rankings
- Timeline data (activity by date)
- Hourly pattern analysis

---

## Troubleshooting

### Database Connection Fails

**Error:** `Unable to connect to the database`

**Solution:**
- Verify PostgreSQL is running: `pg_isready`
- Check `.env` database credentials
- Ensure database exists: `psql -l`
- Test connection: `psql -h localhost -U your_username -d time_tracking_db`

### Toggl API Returns 401 Unauthorized

**Error:** `Request failed with status code 401`

**Solution:**
- Verify `TOGGL_API_TOKEN` in `.env` file
- Check token validity at [Toggl Profile Settings](https://track.toggl.com/profile)
- Ensure token has proper workspace access

### Sync Returns Empty Results

**Solution:**
- Verify `TOGGL_WORKSPACE_ID` is correct
- Check date range (cannot exceed 3 months from today)
- Confirm you have time entries in Toggl for the specified period

### TypeORM Synchronization Issues

**Error:** Database schema mismatch

**Solution:**
- In development: Set `synchronize: true` in `app.module.ts` (line 24)
- In production: Use proper migrations instead of synchronize
- Clear and recreate database if needed

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
- Change `PORT` in `.env` file
- Kill process using port: `lsof -ti:3000 | xargs kill` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)

---

## Production Considerations

Before deploying to production:

1. **Disable Synchronize:**
   - Set `synchronize: false` in `src/app.module.ts`
   - Use TypeORM migrations for schema changes

2. **Environment Variables:**
   - Use secure credential management
   - Never commit `.env` file to version control

3. **CORS Configuration:**
   - Configure allowed origins in `main.ts`
   - Enable credentials if needed for frontend

4. **Rate Limiting:**
   - Implement rate limiting for public endpoints
   - Respect Toggl API rate limits

5. **Logging:**
   - Configure production-grade logging (Winston, etc.)
   - Set `NODE_ENV=production`

6. **Database:**
   - Use connection pooling for production
   - Regular backups
   - Implement proper indexes for frequently queried fields

---

## Related Documentation

- **Frontend Application:** `../frontend/README.md`
- **Toggl API Documentation:** [https://developers.track.toggl.com/docs/](https://developers.track.toggl.com/docs/)

---

## License

UNLICENSED - Private project
