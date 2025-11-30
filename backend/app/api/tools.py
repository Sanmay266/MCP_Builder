from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
import json

router = APIRouter()

@router.post("/{project_id}/tools/", response_model=schemas.Tool)
def create_tool(project_id: int, tool: schemas.ToolCreate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Convert dicts to JSON strings for DB storage
    input_schema_str = json.dumps(tool.input_schema) if tool.input_schema else None
    
    db_tool = models.Tool(
        project_id=project_id,
        name=tool.name,
        description=tool.description,
        input_schema=input_schema_str,
        output_schema=tool.output_schema,
        handler_type=tool.handler_type,
        handler_code=tool.handler_code
    )
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool

@router.get("/{project_id}/tools/", response_model=List[schemas.Tool])
def read_tools(project_id: int, db: Session = Depends(get_db)):
    tools = db.query(models.Tool).filter(models.Tool.project_id == project_id).all()
    
    result = []
    for t in tools:
        t_dict = t.__dict__
        if t.input_schema:
            try:
                t_dict['input_schema'] = json.loads(t.input_schema)
            except:
                t_dict['input_schema'] = {}
        result.append(t_dict)
    return result

@router.put("/{project_id}/tools/{tool_id}", response_model=schemas.Tool)
def update_tool(project_id: int, tool_id: int, tool: schemas.ToolCreate, db: Session = Depends(get_db)):
    db_tool = db.query(models.Tool).filter(
        models.Tool.id == tool_id, 
        models.Tool.project_id == project_id
    ).first()
    
    if db_tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Update tool fields
    db_tool.name = tool.name
    db_tool.description = tool.description
    db_tool.input_schema = json.dumps(tool.input_schema) if tool.input_schema else None
    db_tool.output_schema = tool.output_schema
    db_tool.handler_type = tool.handler_type
    db_tool.handler_code = tool.handler_code
    
    db.commit()
    db.refresh(db_tool)
    
    # Parse input_schema back to dict for response
    result = db_tool.__dict__
    if db_tool.input_schema:
        try:
            result['input_schema'] = json.loads(db_tool.input_schema)
        except:
            result['input_schema'] = {}
    
    return result

@router.delete("/{project_id}/tools/{tool_id}")
def delete_tool(project_id: int, tool_id: int, db: Session = Depends(get_db)):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id, models.Tool.project_id == project_id).first()
    if tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    db.delete(tool)
    db.commit()
    return {"ok": True}
