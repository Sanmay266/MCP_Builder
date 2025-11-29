from typing import List, Dict, Any
import json

def generate_server_py(tools: List[Dict[str, Any]]) -> str:
    code = """from mcp.server.fastmcp import FastMCP

mcp = FastMCP("My MCP Server")

"""
    for tool in tools:
        func_name = tool['name'].replace(" ", "_").lower()
        code += f"""@mcp.tool()
def {func_name}(params: dict) -> str:
    \"\"\"
    {tool.get('description', 'No description')}
    \"\"\"
    # TODO: Implement logic
    return "Executed {tool['name']}"

"""
    
    code += """if __name__ == "__main__":
    mcp.run()
"""
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
