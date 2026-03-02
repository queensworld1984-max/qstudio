# Q Studio - Specification Document

## Project Overview

**Project Name:** Q Studio  
**Type:** Private Professional Digital AI Film Production Operating System  
**Deployment:** Hostinger VPS (Docker + Nginx + SSL)  
**Environment:** Production-Grade, Stateful, Non-Destructive

---

## 1️⃣ PRODUCT VISION

Q Studio is a fully integrated digital AI film production operating system capable of:

- **Pre-production:** Script, Storyboard, Shot Planning
- **Production:** Scene Generation, Cinematography Control
- **Post-production:** Editing, Sound Design, Color Mastering
- **Identity-Locked Character Realism
- **Continuity Management
- **Version Control
- **Render Monitoring
- **Production Planning
- **Asset Management
- **Disaster Recovery

### System Requirements

- **Modular:** Each module (A-X) operates independently with clear interfaces
- **Scalable:** Can handle increased load with additional workers
- **Non-destructive:** All operations preserve original assets
- **State-consistent:** Database enforces referential integrity
- **Production-stable:** Robust error handling and logging
- **Multi-user ready:** Role-based access control
- **Provider-agnostic:** AI abstraction layer for vendor independence

---

## 2️⃣ CORE ARCHITECTURE

### Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js (TypeScript, App Router) |
| Backend | FastAPI (Python) |
| Worker | Python worker services |
| Queue | Redis |
| Database | PostgreSQL |
| Processing | FFmpeg |
| Proxy | Nginx |

### Docker Compose Services

```yaml
services:
  - web       # Next.js frontend
  - api       # FastAPI backend
  - worker    # Background processing
  - postgres  # Database
  - redis     # Queue
  - nginx     # Reverse proxy
```

### Persistent Volumes

- `uploads` - User uploaded assets
- `exports` - Rendered outputs
- `logs` - Application logs
- `postgres` - Database persistence
- `redis` - Cache persistence

---

## 3️⃣ MODULE STRUCTURE

### Phase 1 Implementation (Current)

#### MODULE A — AUTH & MULTI-TENANCY

**Database Schema:**

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens for JWT
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Features:**
- User registration/login
- JWT authentication with access/refresh tokens
- Role-ready structure (user, editor, admin)
- Project isolation per user
- Storage isolation per user
- Access token expiration (15 min)
- Refresh token expiration (7 days)
- Rate limiting (100 req/min)

### Modules B-X - Placeholder Interfaces

#### MODULE B — IDENTITY ENGINE (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/identity/*`  
**Purpose:** Character identity management with face references

#### MODULE C — BODY BUILDER (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/body/*`  
**Purpose:** Adjustable body parameters

#### MODULE D — LIFESTYLE PACK SYSTEM (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/packs/*`  
**Purpose:** Wardrobe and environment packs

#### MODULE E — WARDROBE ENGINE (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/wardrobe/*`  
**Purpose:** Wardrobe item management

#### MODULE F — MAKEUP ENGINE (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/makeup/*`  
**Purpose:** Makeup application

#### MODULE G — VOICE & ACCENT ENGINE (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/voice/*`  
**Purpose:** Voice and speech processing

#### MODULE H — SPACES & ENVIRONMENT BUILDER (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/spaces/*`  
**Purpose:** Environment generation

#### MODULE I — POWER ASSETS (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/assets/*`  
**Purpose:** Crowd and vehicle assets

#### MODULE J — SCENE BUILDER (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/scenes/*`  
**Purpose:** Scene composition and rendering

#### MODULE K — RECORD STUDIO (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/record/*`  
**Purpose:** Video recording and enhancement

#### MODULE L — EDIT STUDIO (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/edit/*`  
**Purpose:** Timeline editing

#### MODULE M — EPISODE BUILDER (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/episodes/*`  
**Purpose:** Episode composition

#### MODULE N — SCRIPT & STORYBOARD ENGINE (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/script/*`  
**Purpose:** Screenplay and storyboard management

#### MODULE O — CINEMATOGRAPHY PANEL (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/cinematography/*`  
**Purpose:** Camera and lighting controls

#### MODULE P — ADVANCED SOUND STUDIO (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/sound/*`  
**Purpose:** Audio mixing

#### MODULE Q — VERSION CONTROL (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/versions/*`  
**Purpose:** Scene versioning

#### MODULE R — RENDER MONITOR (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/render/*`  
**Purpose:** Render queue monitoring

#### MODULE S — COLOR MASTERING (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/color/*`  
**Purpose:** Color grading

#### MODULE T — ASSET MANAGEMENT (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/management/*`  
**Purpose:** Asset organization

#### MODULE U — PERFORMANCE ENGINE (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/performance/*`  
**Purpose:** Animation controls

#### MODULE V — PRODUCTION PLANNER (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/planning/*`  
**Purpose:** Production calendar

#### MODULE W — CONTINUITY ENGINE (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/continuity/*`  
**Purpose:** Continuity tracking

#### MODULE X — BACKUP & RECOVERY (Placeholder)

**Status:** Not implemented in Phase 1  
**Interface:** `/api/backup/*`  
**Purpose:** Backup and restore

---

## 4️⃣ AI PROVIDER ABSTRACTION LAYER

All AI calls must go through abstract interfaces:

```python
class ImageEditProvider(ABC):
    @abstractmethod
    def edit_image(self, image: bytes, params: dict) -> bytes:
        pass

class ImageToVideoProvider(ABC):
    @abstractmethod
    def generate_video(self, image: bytes, params: dict) -> bytes:
        pass

class TTSProvider(ABC):
    @abstractmethod
    def synthesize(self, text: str, voice_id: str) -> bytes:
        pass

class SubtitleProvider(ABC):
    @abstractmethod
    def generate(self, audio: bytes, params: dict) -> str:
        pass

class StyleTransferProvider(ABC):
    @abstractmethod
    def transfer(self, content: bytes, style: bytes) -> bytes:
        pass
```

**Logging Requirements:**
All renders must log:
- Provider name
- Parameters used
- Timestamp
- Scene ID
- Character ID

---

## 5️⃣ PHASE 1 DELIVERABLES

### Core Infrastructure

1. ✅ Docker Compose orchestration
2. ✅ PostgreSQL with schema
3. ✅ Redis for queue
4. ✅ Nginx reverse proxy

### Backend (FastAPI)

1. ✅ Auth module (register, login, refresh, logout)
2. ✅ Project CRUD
3. ✅ User management
4. ✅ All module placeholders (B-X)

### Frontend (Next.js)

1. ✅ Login page
2. ✅ Registration page
3. ✅ Dashboard with project list
4. ✅ Module navigation
5. ✅ Placeholder pages for all modules

### Security

1. ✅ JWT authentication
2. ✅ Password hashing (bcrypt)
3. ✅ Rate limiting
4. ✅ CORS configuration
5. ✅ Input validation (Pydantic)

---

## 6️⃣ DEPLOYMENT

### Environment Variables

```env
# Database
POSTGRES_USER=qstudio
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=qstudio

# Redis
REDIS_PASSWORD=<secure-password>

# JWT
JWT_SECRET_KEY=<secure-secret>
JWT_ALGORITHM=HS256

# API
API_URL=http://api:8000
FRONTEND_URL=http://web:3000

# Nginx
SSL_EMAIL=admin@qstudio.com
```

### Build Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d --build
```

---

## 7️⃣ ACCEPTANCE CRITERIA

### Phase 1 Complete When:

- [x] System architecture documented in SPEC.md
- [x] Docker Compose services run without errors
- [x] PostgreSQL schema created with all tables
- [x] FastAPI backend starts and responds
- [x] Next.js frontend builds and runs
- [x] User registration works
- [x] User login works with JWT
- [x] Project CRUD operations work
- [x] All module placeholders return 501 Not Implemented
- [x] Nginx proxy routes traffic correctly

### Production-Ready Validation:

- [ ] All endpoints return proper error codes
- [ ] Rate limiting prevents abuse
- [ ] JWT tokens expire correctly
- [ ] Passwords are properly hashed
- [ ] Database queries are parameterized
- [ ] CORS is properly configured

---

## 8️⃣ FUTURE EXPANSION NOTES

### Phase 2 (Modules B-G)
- Identity Engine implementation
- Body Builder implementation
- Lifestyle Pack System
- Wardrobe Engine
- Makeup Engine
- Voice & Accent Engine

### Phase 3 (Modules H-M)
- Spaces & Environment Builder
- Power Assets
- Scene Builder
- Record Studio
- Edit Studio
- Episode Builder

### Phase 4-5 (Modules N-X)
- Script & Storyboard
- Cinematography Panel
- Advanced Sound Studio
- Version Control
- Render Monitor
- Color Mastering
- Asset Management
- Performance Engine
- Production Planner
- Continuity Engine
- Backup & Recovery

---

*Document Version: 1.0*  
*Last Updated: 2026-03-02*
