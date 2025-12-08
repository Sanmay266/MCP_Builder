# Production Readiness Checklist

## Overview
This document outlines all changes needed to make MCPForge production-ready for deployment.

**Estimated Time:** 5-7 hours  
**Priority:** Critical before public launch

---

## 1. Database Migration (1 hour)

### Current Issue
- Using SQLite file database (`mcpforge.db`)
- Lost on server restart/redeployment
- Not suitable for cloud hosting

### Solution: Switch to Neon PostgreSQL

#### Steps:
1. **Sign up for Neon** (https://neon.tech)
   - Create project
   - Get connection string: `postgresql://user:pass@ep-xxx.neon.tech/mcpforge`

2. **Update `backend/requirements.txt`**
   ```txt
   fastapi
   uvicorn
   sqlalchemy
   pydantic
   python-multipart
   jinja2
   psycopg2-binary  # ADD THIS
   ```

3. **Update `backend/app/database.py`**
   ```python
   import os
   from sqlalchemy import create_engine
   from sqlalchemy.ext.declarative import declarative_base
   from sqlalchemy.orm import sessionmaker

   # Use environment variable or fallback to SQLite for local dev
   SQLALCHEMY_DATABASE_URL = os.getenv(
       "DATABASE_URL",
       "sqlite:///./mcpforge.db"
   )

   # PostgreSQL requires different connection args
   connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

   engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
   SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
   Base = declarative_base()

   def get_db():
       db = SessionLocal()
       try:
           yield db
       finally:
           db.close()
   ```

4. **Set environment variable**
   - Render: Add `DATABASE_URL` in dashboard
   - Local: Create `.env` file (add to `.gitignore`)

---

## 2. Environment Variables (30 min)

### Current Issue
- Hardcoded `http://localhost:8000` in frontend
- Hardcoded `http://localhost:3000` in backend CORS

### Solution: Use environment variables

#### Frontend Changes

1. **Create `frontend/.env.local`** (for local dev)
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. **Create `frontend/.env.production`** (for deployment)
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

3. **Update `frontend/src/lib/api.ts`**
   ```typescript
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
   ```

4. **Add to `.gitignore`**
   ```
   .env.local
   .env.production
   ```

#### Backend Changes

1. **Create `backend/.env`** (for local dev)
   ```env
   DATABASE_URL=sqlite:///./mcpforge.db
   FRONTEND_URL=http://localhost:3000
   ENVIRONMENT=development
   ```

2. **Create `backend/.env.production`** (for deployment)
   ```env
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/mcpforge
   FRONTEND_URL=https://your-app.vercel.app
   ENVIRONMENT=production
   ```

3. **Install python-dotenv**
   ```txt
   # Add to requirements.txt
   python-dotenv
   ```

4. **Update `backend/app/main.py`**
   ```python
   import os
   from dotenv import load_dotenv
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   from .database import engine, Base
   from . import models

   # Load environment variables
   load_dotenv()

   # Create database tables
   Base.metadata.create_all(bind=engine)

   app = FastAPI(title="MCPForge API", version="1.0.0")

   # CORS Configuration from environment
   frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
   origins = [
       frontend_url,
       "http://localhost:3000",
       "http://localhost:3001",
       "http://127.0.0.1:3000",
       "http://127.0.0.1:3001",
   ]

   app.add_middleware(
       CORSMiddleware,
       allow_origins=origins,
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

   @app.get("/")
   def read_root():
       return {"message": "Welcome to MCPForge API", "environment": os.getenv("ENVIRONMENT", "development")}

   from .api import projects, tools, generator

   app.include_router(projects.router, prefix="/projects", tags=["projects"])
   app.include_router(tools.router, prefix="/projects", tags=["tools"])
   app.include_router(generator.router, prefix="/projects", tags=["generator"])
   ```

---

## 3. Health Check Endpoint (15 min)

### Add to `backend/app/main.py`

```python
from datetime import datetime

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/api/health/db")
def database_health(db: Session = Depends(get_db)):
    """Check database connectivity"""
    try:
        # Try a simple query
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
```

---

## 4. Error Logging (1 hour)

### Option A: Sentry (Recommended)

1. **Sign up for Sentry** (https://sentry.io) - Free tier available

2. **Install Sentry**
   ```txt
   # Add to backend/requirements.txt
   sentry-sdk[fastapi]
   ```

3. **Update `backend/app/main.py`**
   ```python
   import sentry_sdk
   from sentry_sdk.integrations.fastapi import FastApiIntegration

   # Initialize Sentry
   if os.getenv("SENTRY_DSN"):
       sentry_sdk.init(
           dsn=os.getenv("SENTRY_DSN"),
           integrations=[FastApiIntegration()],
           traces_sample_rate=1.0,
           environment=os.getenv("ENVIRONMENT", "development"),
       )
   ```

4. **Add to `.env.production`**
   ```env
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ```

### Option B: Simple File Logging

```python
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
if os.getenv("ENVIRONMENT") == "production":
    handler = RotatingFileHandler("app.log", maxBytes=10000000, backupCount=3)
    handler.setLevel(logging.ERROR)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
```

---

## 5. Rate Limiting (2 hours)

### Install slowapi

```txt
# Add to backend/requirements.txt
slowapi
```

### Update `backend/app/main.py`

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to routes
@app.get("/projects/")
@limiter.limit("100/minute")
def read_projects(request: Request, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # ... existing code
```

### Add rate limits to critical endpoints:
- `POST /projects/` - 10/minute
- `POST /projects/{id}/tools/` - 20/minute
- `GET /projects/{id}/export` - 5/minute

---

## 6. Project Export/Import (1 hour)

### Add to `backend/app/api/projects.py`

```python
from fastapi.responses import JSONResponse
import json

@router.get("/{project_id}/export-json")
def export_project_json(project_id: int, db: Session = Depends(get_db)):
    """Export project as JSON for backup"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tools = db.query(models.Tool).filter(models.Tool.project_id == project_id).all()
    
    export_data = {
        "name": project.name,
        "created_at": project.created_at.isoformat(),
        "tools": [
            {
                "name": t.name,
                "description": t.description,
                "input_schema": json.loads(t.input_schema) if t.input_schema else {},
                "output_schema": t.output_schema,
                "handler_type": t.handler_type,
                "handler_code": t.handler_code
            }
            for t in tools
        ]
    }
    
    return JSONResponse(content=export_data)

@router.post("/import-json")
def import_project_json(project_data: dict, db: Session = Depends(get_db)):
    """Import project from JSON backup"""
    # Create project
    db_project = models.Project(name=project_data["name"])
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Create tools
    for tool_data in project_data.get("tools", []):
        db_tool = models.Tool(
            project_id=db_project.id,
            name=tool_data["name"],
            description=tool_data.get("description"),
            input_schema=json.dumps(tool_data.get("input_schema", {})),
            output_schema=tool_data.get("output_schema"),
            handler_type=tool_data["handler_type"],
            handler_code=tool_data.get("handler_code")
        )
        db.add(db_tool)
    
    db.commit()
    return {"id": db_project.id, "message": "Project imported successfully"}
```

### Add UI button in frontend

```typescript
// In frontend/app/projects/[id]/page.tsx
async function handleExportJSON() {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/export-json`);
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-backup.json`;
    a.click();
}
```

---

## 7. Security Headers (15 min)

### Add to `backend/app/main.py`

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

# Add security middleware
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["your-domain.com", "*.vercel.app", "*.onrender.com"]
    )

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

---

## 8. Deployment Configuration Files

### Create `backend/render.yaml`

```yaml
services:
  - type: web
    name: mcpforge-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: ENVIRONMENT
        value: production
      - key: SENTRY_DSN
        sync: false
```

### Create `frontend/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url"
  }
}
```

---

## 9. README Updates

### Add deployment instructions

```markdown
## Deployment

### Backend (Render)
1. Connect GitHub repo
2. Select `backend` folder
3. Add environment variables:
   - `DATABASE_URL` - Neon PostgreSQL connection string
   - `FRONTEND_URL` - Your Vercel URL
   - `ENVIRONMENT` - `production`
4. Deploy

### Frontend (Vercel)
1. Connect GitHub repo
2. Set root directory to `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` - Your Render backend URL
4. Deploy

### Database (Neon)
1. Create project at neon.tech
2. Copy connection string
3. Add to Render environment variables
```

---

## Testing Checklist

Before going live, test:

- [ ] Create project
- [ ] Add tool
- [ ] Edit tool
- [ ] Delete tool
- [ ] Export server ZIP
- [ ] Export project JSON
- [ ] Dark mode toggle
- [ ] All toast notifications
- [ ] Validation errors
- [ ] Template library
- [ ] Code preview
- [ ] Health check endpoint
- [ ] Database persistence (restart server, data remains)
- [ ] CORS from production frontend
- [ ] Rate limiting (make 100+ requests)

---

## Estimated Timeline

| Task | Time |
|------|------|
| Database migration | 1 hour |
| Environment variables | 30 min |
| Health checks | 15 min |
| Error logging | 1 hour |
| Rate limiting | 2 hours |
| Export/Import | 1 hour |
| Security headers | 15 min |
| Testing | 1 hour |
| **Total** | **6-7 hours** |

---

## Post-Deployment Monitoring

1. **Check Sentry** for errors
2. **Monitor Render logs** for crashes
3. **Check Neon dashboard** for database usage
4. **Test health endpoint** regularly
5. **Monitor rate limit hits**

---

## Notes

- Keep `.env` files in `.gitignore`
- Never commit secrets to GitHub
- Use Render/Vercel environment variable UI for secrets
- Test locally with production env vars before deploying
