from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    mcp_json = Column(Text, nullable=True) # Storing the generated config as JSON string

    tools = relationship("Tool", back_populates="project", cascade="all, delete-orphan")

class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String, index=True)
    description = Column(String)
    input_schema = Column(Text) # JSON string for input parameters
    output_schema = Column(Text) # JSON string for output description
    handler_type = Column(String) # "static" or "api"
    handler_code = Column(Text, nullable=True) # For custom logic or API details

    project = relationship("Project", back_populates="tools")
