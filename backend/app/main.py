from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MCPForge API", version="1.0.0")

# CORS Configuration
origins = [
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
    return {"message": "Welcome to MCPForge API"}

from .api import projects, tools, generator

app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(tools.router, prefix="/projects", tags=["tools"]) # Nested under projects for tools
app.include_router(generator.router, prefix="/projects", tags=["generator"])
