from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class ToolBase(BaseModel):
    name: str
    description: Optional[str] = None
    input_schema: Optional[Dict[str, Any]] = None # We'll store as dict in Pydantic, convert to JSON string for DB
    output_schema: Optional[str] = None
    handler_type: str
    handler_code: Optional[str] = None

class ToolCreate(ToolBase):
    pass

class Tool(ToolBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    mcp_json: Optional[str] = None
    tools: List[Tool] = []

    class Config:
        from_attributes = True
