from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..core import generator, validation
import io
import zipfile
import json

router = APIRouter()

@router.get("/{project_id}/export")
def export_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get tools
    tools = db.query(models.Tool).filter(models.Tool.project_id == project_id).all()
    tools_data = []
    for t in tools:
        t_dict = t.__dict__
        if t.input_schema:
            try:
                t_dict['input_schema'] = json.loads(t.input_schema)
            except:
                t_dict['input_schema'] = {}
        tools_data.append(t_dict)

    # Validate
    errors = validation.validate_project_config(tools_data)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})

    # Generate code
    server_code = generator.generate_server_py(tools_data)
    mcp_config = generator.generate_mcp_json(tools_data)
    readme = generator.generate_readme()

    # Create ZIP
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("server.py", server_code)
        zip_file.writestr("mcp.json", mcp_config)
        zip_file.writestr("README.md", readme)
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=mcp_project_{project_id}.zip"}
    )
