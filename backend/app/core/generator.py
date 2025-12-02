from typing import List, Dict, Any
import json

TYPE_MAP = {
    'string': 'str',
    'number': 'float',
    'integer': 'int',
    'boolean': 'bool',
    'array': 'list',
    'object': 'dict',
}

def generate_server_py(tools: List[Dict[str, Any]], server_name: str = "My MCP Server") -> str:
    code = f'''from mcp.server.fastmcp import FastMCP

mcp = FastMCP("{server_name}")

'''
    for tool in tools:
        func_name = tool['name'].replace(" ", "_").replace("-", "_").lower()
        description = tool.get('description', 'No description')
        input_schema = tool.get('input_schema', {})
        handler_type = tool.get('handler_type', 'static')
        handler_code = tool.get('handler_code', '')
        
        # Build typed parameters
        params = []
        param_docs = []
        properties = input_schema.get('properties', {})
        required = input_schema.get('required', [])
        
        for param_name, param_def in properties.items():
            param_type = TYPE_MAP.get(param_def.get('type', 'string'), 'str')
            param_desc = param_def.get('description', '')
            
            if param_name in required:
                params.append(f"{param_name}: {param_type}")
            else:
                default = '""' if param_type == 'str' else 'None'
                if param_type == 'int':
                    default = '0'
                elif param_type == 'float':
                    default = '0.0'
                elif param_type == 'bool':
                    default = 'False'
                elif param_type == 'list':
                    default = '[]'
                elif param_type == 'dict':
                    default = '{}'
                params.append(f"{param_name}: {param_type} = {default}")
            
            if param_desc:
                param_docs.append(f"        {param_name}: {param_desc}")
        
        params_str = ", ".join(params) if params else ""
        
        # Build docstring
        docstring = f'"""{description}'
        if param_docs:
            docstring += "\n\n    Args:\n" + "\n".join(param_docs)
        docstring += '"""'
        
        # Build function body based on handler type
        if handler_type == 'api' and handler_code:
            body = f'''    import requests
    response = requests.get("{handler_code}")
    return response.text'''
        else:
            body = f'    return "Executed {tool["name"]}"'
        
        code += f'''@mcp.tool()
def {func_name}({params_str}) -> str:
    {docstring}
{body}

'''
    
    code += '''if __name__ == "__main__":
    mcp.run()
'''
    return code

def generate_mcp_json(tools: List[Dict[str, Any]]) -> str:
    config = {
        "name": "My MCP Server",
        "version": "1.0.0",
        "tools": tools
    }
    return json.dumps(config, indent=2)

def generate_readme() -> str:
    return """# Generated MCP Server

## Running the server

1. Install dependencies:
   ```bash
   pip install mcp
   ```

2. Run the server:
   ```bash
   python server.py
   ```
"""
