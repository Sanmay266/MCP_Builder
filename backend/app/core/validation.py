from typing import List, Dict, Any

def validate_tool_schema(tool: Dict[str, Any]) -> List[str]:
    errors = []
    if not tool.get("name"):
        errors.append("Tool name is required")
    if not tool.get("input_schema"):
        # It's okay to have empty input schema, but it should be a dict if present
        pass
    
    # Add more validation logic here (e.g. checking for duplicate names in a project context, but that requires project data)
    return errors

def validate_project_config(project_tools: List[Dict[str, Any]]) -> List[str]:
    errors = []
    tool_names = set()
    for tool in project_tools:
        if tool['name'] in tool_names:
            errors.append(f"Duplicate tool name: {tool['name']}")
        tool_names.add(tool['name'])
        
        tool_errors = validate_tool_schema(tool)
        errors.extend(tool_errors)
    
    return errors
