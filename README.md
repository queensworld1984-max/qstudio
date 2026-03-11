# Q Studio

**Private Professional Digital AI Film Production Operating System**

Q Studio is a fully integrated digital AI film production platform capable of pre-production (script, storyboard, shot planning), production (scene generation, cinematography control), and post-production (editing, sound design, color mastering).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 (TypeScript, App Router) |
| Backend | FastAPI (Python) |
| Worker | Python background services |
| Queue | Redis |
| Database | PostgreSQL |
| Processing | FFmpeg |
| Proxy | Nginx |
| Container | Docker Compose |

## Architecture

```
                    +----------+
                    |  Nginx   |
                    |  (proxy) |
                    +----+-----+
                         |
              +----------+----------+
              |                     |
        +-----+-----+       +------+------+
        |  Next.js   |       |   FastAPI   |
        |  Frontend  |       |   Backend   |
        |  (port 3000)|      |  (port 8000)|
        +------------+       +------+------+
                                    |
                         +----------+----------+
                         |                     |
                   +-----+-----+        +------+------+
                   | PostgreSQL |        |    Redis    |
                   |  (port 5432)|       |  (port 6379)|
                   +------------+        +------+------+
                                                |
                                         +------+------+
                                         |   Worker    |
                                         |  (renders)  |
                                         +-------------+
```

## Modules

### Phase 1 (Implemented)
- **Module A** - Auth & Multi-tenancy (JWT, RBAC, project isolation)
- **Module B** - Identity Engine (character management, face references)
- **Module J** - Scene Builder (multi-character scenes, cinematography)
- **Module K** - Record Studio / Render Queue (background processing)
- **Module M** - Episode Builder (scene stitching, export)

### Phase 2-5 (Placeholder)
- Body Builder, Lifestyle Packs, Wardrobe, Makeup, Voice & Accent
- Spaces & Environment, Power Assets, Script & Storyboard
- Cinematography Panel, Sound Studio, Version Control
- Render Monitor, Color Mastering, Asset Management
- Performance Engine, Production Planner, Continuity, Backup & Recovery

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone and configure

```bash
git clone https://github.com/queensworld1984-max/qstudio.git
cd qstudio
cp .env.example .env
```

Edit `.env` with your production values (especially passwords and JWT secret).

### 2. Start all services

```bash
# Development
docker-compose up --build

# Production (detached)
docker-compose up -d --build
```

### 3. Access the application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### 4. Create your first account

1. Navigate to http://localhost:3000
2. Click "Get Started" to register
3. After registration, you'll be redirected to the dashboard

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT tokens)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (invalidate tokens)
- `GET /api/auth/me` - Get current user info

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Identity Engine
- `GET /api/identity/characters` - List characters
- `POST /api/identity/characters` - Create character
- `GET /api/identity/characters/{id}` - Get character
- `PUT /api/identity/characters/{id}` - Update character
- `DELETE /api/identity/characters/{id}` - Delete character
- `POST /api/identity/characters/{id}/faces` - Add face reference
- `GET /api/identity/characters/{id}/faces` - List face references
- `POST /api/identity/characters/{id}/versions` - Create character version
- `POST /api/identity/verify-identity` - Verify identity match

### Scenes
- `GET /api/scenes/scenes` - List scenes
- `POST /api/scenes/scenes` - Create scene
- `GET /api/scenes/scenes/{id}` - Get scene
- `PUT /api/scenes/scenes/{id}` - Update scene
- `DELETE /api/scenes/scenes/{id}` - Delete scene
- `POST /api/scenes/scenes/{id}/render` - Submit render job

### Render Queue
- `GET /api/render/jobs` - List render jobs
- `POST /api/render/jobs` - Create render job
- `GET /api/render/jobs/{id}` - Get job status
- `POST /api/render/jobs/{id}/start` - Start render job
- `POST /api/render/jobs/{id}/poll` - Poll job progress
- `DELETE /api/render/jobs/{id}` - Delete job

### Episodes
- `GET /api/episodes/episodes` - List episodes
- `POST /api/episodes/episodes` - Create episode
- `GET /api/episodes/episodes/{id}` - Get episode
- `PUT /api/episodes/episodes/{id}` - Update episode
- `DELETE /api/episodes/episodes/{id}` - Delete episode
- `POST /api/episodes/episodes/{id}/export` - Export episode

## Environment Variables

See `.env.example` for all required configuration:

```env
POSTGRES_USER=qstudio
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=qstudio
REDIS_PASSWORD=<secure-password>
JWT_SECRET_KEY=<min-32-char-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## Development

### Backend (standalone)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (standalone)

```bash
cd frontend
npm install
npm run dev
```

### Worker (standalone)

```bash
cd worker
pip install -r requirements.txt
python main.py
```

## Deployment

The project is configured for deployment on a VPS using Docker Compose with Nginx as a reverse proxy. See `docker-compose.yml` and `nginx/nginx.conf` for production configuration.

## License

Private and proprietary. All rights reserved.
