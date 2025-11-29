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
    # We need to parse the JSON strings back to dicts for the response if Pydantic expects dicts
    # However, our Pydantic model has input_schema as Dict, but DB has Text.
    # We might need a separate Pydantic model for DB reading or handle this in the route.
    # Let's update the response model or handle conversion.
    # Actually, Pydantic's orm_mode might not automatically parse JSON string to Dict.
    # Let's fix this by manually converting or using a property in the model.
    # For now, let's just return them and see if Pydantic handles it (it won't).
    
    # Better approach: Update the Pydantic model to use Json type or handle it here.
    # Let's just return the objects and let Pydantic try, but it will likely fail.
    # I'll modify the Pydantic schema in a separate step if needed, or do manual conversion here.
    
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

@router.delete("/{project_id}/tools/{tool_id}")
def delete_tool(project_id: int, tool_id: int, db: Session = Depends(get_db)):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id, models.Tool.project_id == project_id).first()
    if tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    db.delete(tool)
    db.commit()
    return {"ok": True}
