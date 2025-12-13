from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
import json
import time
from typing import Any, Dict, List

router = APIRouter()


def validate_inputs(inputs: dict, schema: dict) -> List[str]:
    """Validate inputs against JSON schema"""
    errors = []
    required = schema.get("required", [])
    properties = schema.get("properties", {})

    # Check required fields
    for field in required:
        if field not in inputs:
            errors.append(f"Missing required field: {field}")

    # Check types
    for field, value in inputs.items():
        if field in properties:
            expected_type = properties[field].get("type")
            if not validate_type(value, expected_type):
                errors.append(f"Invalid type for {field}: expected {expected_type}, got {type(value).__name__}")

    return errors


def validate_type(value: Any, expected_type: str) -> bool:
    """Check if value matches expected JSON schema type"""
    type_map = {
        "string": str,
        "number": (int, float),
        "integer": int,
        "boolean": bool,
        "array": list,
        "object": dict,
    }
    expected_python_type = type_map.get(expected_type)
    return isinstance(value, expected_python_type) if expected_python_type else True


def execute_static_tool(tool: models.Tool, inputs: dict) -> Dict[str, Any]:
    """Execute static response tool"""
    return {
        "success": True,
        "output": f"Tool '{tool.name}' executed successfully with inputs: {json.dumps(inputs)}",
        "execution_time_ms": 0,
        "tool_name": tool.name,
    }


async def execute_api_tool(tool: models.Tool, inputs: dict) -> Dict[str, Any]:
    """Execute API call tool"""
    import httpx

    start = time.time()

    try:
        # Replace placeholders in URL with inputs
        url = tool.handler_code
        for key, value in inputs.items():
            url = url.replace(f"{{{key}}}", str(value))

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            execution_time = int((time.time() - start) * 1000)

            return {
                "success": True,
                "output": response.text[:1000],  # Limit output size
                "status_code": response.status_code,
                "execution_time_ms": execution_time,
                "tool_name": tool.name,
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "execution_time_ms": int((time.time() - start) * 1000),
            "tool_name": tool.name,
        }


@router.post("/{project_id}/tools/{tool_id}/test")
async def test_tool(
    project_id: int, tool_id: int, inputs: dict, db: Session = Depends(get_db)
):
    """Execute a tool with given inputs and return result"""

    # Get tool
    tool = db.query(models.Tool).filter(
        models.Tool.id == tool_id, models.Tool.project_id == project_id
    ).first()

    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Validate inputs against schema
    input_schema = json.loads(tool.input_schema) if tool.input_schema else {}
    validation_errors = validate_inputs(inputs, input_schema)
    if validation_errors:
        return {"success": False, "errors": validation_errors, "tool_name": tool.name}

    # Execute tool based on handler type
    if tool.handler_type == "static":
        result = execute_static_tool(tool, inputs)
    elif tool.handler_type == "api":
        result = await execute_api_tool(tool, inputs)
    else:
        raise HTTPException(status_code=400, detail="Unknown handler type")

    return result


@router.post("/{project_id}/validate")
def validate_project(project_id: int, db: Session = Depends(get_db)):
    """Comprehensive project validation"""
    errors = []
    warnings = []

    project = (
        db.query(models.Project).filter(models.Project.id == project_id).first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tools = db.query(models.Tool).filter(models.Tool.project_id == project_id).all()

    # Check for duplicate tool names
    tool_names = [t.name for t in tools]
    duplicates = [name for name in tool_names if tool_names.count(name) > 1]
    if duplicates:
        errors.append(f"Duplicate tool names: {', '.join(set(duplicates))}")

    # Validate each tool
    for tool in tools:
        # Check Python identifier
        if not tool.name.replace("_", "").isalnum():
            errors.append(f"'{tool.name}': Invalid Python function name")

        # Check API endpoints
        if tool.handler_type == "api":
            if not tool.handler_code:
                errors.append(f"'{tool.name}': Missing API endpoint")
            elif not tool.handler_code.startswith(("http://", "https://")):
                warnings.append(
                    f"'{tool.name}': API endpoint should start with http:// or https://"
                )

        # Validate schema
        if tool.input_schema:
            try:
                schema = json.loads(tool.input_schema)
                if not isinstance(schema, dict):
                    errors.append(f"'{tool.name}': Invalid schema format")
            except json.JSONDecodeError:
                errors.append(f"'{tool.name}': Invalid JSON in schema")

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}
