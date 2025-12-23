from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..core import generator
from .websocket import manager
import json
import time

router = APIRouter()

async def broadcast_code_update(project_id: int, db: Session):
    """Generate latest server code and broadcast to connected clients"""
    tools = db.query(models.Tool).filter(models.Tool.project_id == project_id).all()
    
    tools_data = []
    for t in tools:
        t_dict = {
            'name': t.name,
            'description': t.description,
            'input_schema': json.loads(t.input_schema) if t.input_schema else {},
            'output_schema': t.output_schema,
            'handler_type': t.handler_type,
            'handler_code': t.handler_code
        }
        tools_data.append(t_dict)
        
    code = generator.generate_server_py(tools_data)
    
    await manager.broadcast(project_id, {
        "type": "code_update",
        "code": code,
        "timestamp": time.time()
    })

@router.post("/{project_id}/tools/", response_model=schemas.Tool)
async def create_tool(project_id: int, tool: schemas.ToolCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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
    
    # Broadcast update
    await broadcast_code_update(project_id, db)
    
    return {
        'id': db_tool.id,
        'project_id': db_tool.project_id,
        'name': db_tool.name,
        'description': db_tool.description,
        'input_schema': tool.input_schema or {},
        'output_schema': db_tool.output_schema,
        'handler_type': db_tool.handler_type,
        'handler_code': db_tool.handler_code
    }

@router.get("/{project_id}/tools/", response_model=List[schemas.Tool])
def read_tools(project_id: int, db: Session = Depends(get_db)):
    tools = db.query(models.Tool).filter(models.Tool.project_id == project_id).all()
    
    result = []
    for t in tools:
        input_schema = {}
        if t.input_schema:
            try:
                input_schema = json.loads(t.input_schema)
            except:
                input_schema = {}
        result.append({
            'id': t.id,
            'project_id': t.project_id,
            'name': t.name,
            'description': t.description,
            'input_schema': input_schema,
            'output_schema': t.output_schema,
            'handler_type': t.handler_type,
            'handler_code': t.handler_code
        })
    return result

@router.put("/{project_id}/tools/{tool_id}", response_model=schemas.Tool)
async def update_tool(project_id: int, tool_id: int, tool: schemas.ToolCreate, db: Session = Depends(get_db)):
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
    
    # Broadcast update
    await broadcast_code_update(project_id, db)
    
    # Parse input_schema back to dict for response
    input_schema = {}
    if db_tool.input_schema:
        try:
            input_schema = json.loads(db_tool.input_schema)
        except:
            input_schema = {}
    
    return {
        'id': db_tool.id,
        'project_id': db_tool.project_id,
        'name': db_tool.name,
        'description': db_tool.description,
        'input_schema': input_schema,
        'output_schema': db_tool.output_schema,
        'handler_type': db_tool.handler_type,
        'handler_code': db_tool.handler_code
    }

@router.delete("/{project_id}/tools/{tool_id}")
async def delete_tool(project_id: int, tool_id: int, db: Session = Depends(get_db)):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id, models.Tool.project_id == project_id).first()
    if tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    db.delete(tool)
    db.commit()
    
    # Broadcast update
    await broadcast_code_update(project_id, db)
    
    return {"ok": True}
