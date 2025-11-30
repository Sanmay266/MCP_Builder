from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
import json

router = APIRouter()

def serialize_tool(t):
    input_schema = {}
    if t.input_schema:
        try:
            input_schema = json.loads(t.input_schema)
        except:
            input_schema = {}
    return {
        'id': t.id,
        'project_id': t.project_id,
        'name': t.name,
        'description': t.description,
        'input_schema': input_schema,
        'output_schema': t.output_schema,
        'handler_type': t.handler_type,
        'handler_code': t.handler_code
    }

def serialize_project(p):
    return {
        'id': p.id,
        'name': p.name,
        'created_at': p.created_at,
        'mcp_json': p.mcp_json,
        'tools': [serialize_tool(t) for t in p.tools]
    }

@router.post("/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(name=project.name)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return serialize_project(db_project)

@router.get("/", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = db.query(models.Project).offset(skip).limit(limit).all()
    return [serialize_project(p) for p in projects]

@router.get("/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return serialize_project(project)

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True}
