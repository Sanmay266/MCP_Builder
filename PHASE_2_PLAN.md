# Phase 2: Interactive MCP Sandbox

## Overview
Transform MCPForge from a code generator into a full development environment with live testing, debugging, and AI assistance.

**Goal:** Let users test MCP servers without leaving the browser  
**Timeline:** 4-6 weeks  
**Success Metric:** 80%+ of users test tools before exporting

---

## Feature Breakdown

### Priority 1: Tool Invocation Simulator (Week 1)
**The "Postman for MCP" — Highest ROI feature**

#### What It Does
- Users can test individual tools without exporting
- Provide inputs via form
- See outputs in real-time
- Catch errors before deployment

#### Implementation

##### Backend Changes

1. **Create `backend/app/api/sandbox.py`**
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
import json
import subprocess
import tempfile
import os

router = APIRouter()

@router.post("/{project_id}/tools/{tool_id}/test")
async def test_tool(
    project_id: int,
    tool_id: int,
    inputs: dict,
    db: Session = Depends(get_db)
):
    """Execute a tool with given inputs and return result"""
    
    # Get tool
    tool = db.query(models.Tool).filter(
        models.Tool.id == tool_id,
        models.Tool.project_id == project_id
    ).first()
    
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Validate inputs against schema
    input_schema = json.loads(tool.input_schema) if tool.input_schema else {}
    validation_errors = validate_inputs(inputs, input_schema)
    if validation_errors:
        return {"success": False, "errors": validation_errors}
    
    # Execute tool based on handler type
    if tool.handler_type == "static":
        result = execute_static_tool(tool, inputs)
    elif tool.handler_type == "api":
        result = await execute_api_tool(tool, inputs)
    else:
        raise HTTPException(status_code=400, detail="Unknown handler type")
    
    return result

def validate_inputs(inputs: dict, schema: dict) -> list:
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
                errors.append(f"Invalid type for {field}: expected {expected_type}")
    
    return errors

def validate_type(value, expected_type):
    """Check if value matches expected JSON schema type"""
    type_map = {
        "string": str,
        "number": (int, float),
        "integer": int,
        "boolean": bool,
        "array": list,
        "object": dict
    }
    expected_python_type = type_map.get(expected_type)
    return isinstance(value, expected_python_type) if expected_python_type else True

def execute_static_tool(tool, inputs):
    """Execute static response tool"""
    return {
        "success": True,
        "output": f"Executed {tool.name} with inputs: {inputs}",
        "execution_time_ms": 0
    }

async def execute_api_tool(tool, inputs):
    """Execute API call tool"""
    import httpx
    import time
    
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
                "output": response.text,
                "status_code": response.status_code,
                "execution_time_ms": execution_time
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "execution_time_ms": int((time.time() - start) * 1000)
        }
```

2. **Add to `backend/requirements.txt`**
```txt
httpx  # For async HTTP requests
```

3. **Register router in `backend/app/main.py`**
```python
from .api import projects, tools, generator, sandbox

app.include_router(sandbox.router, prefix="/sandbox", tags=["sandbox"])
```

##### Frontend Changes

1. **Create `frontend/src/components/ToolTester.tsx`**
```typescript
"use client";

import React, { useState } from 'react';
import { Play, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ToolTesterProps {
    projectId: number;
    tool: {
        id: number;
        name: string;
        input_schema: any;
        handler_type: string;
    };
}

export function ToolTester({ projectId, tool }: ToolTesterProps) {
    const [inputs, setInputs] = useState<Record<string, any>>({});
    const [result, setResult] = useState<any>(null);
    const [testing, setTesting] = useState(false);

    const properties = tool.input_schema?.properties || {};
    const required = tool.input_schema?.required || [];

    async function handleTest() {
        setTesting(true);
        setResult(null);

        try {
            const response = await fetch(
                `http://localhost:8000/sandbox/${projectId}/tools/${tool.id}/test`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(inputs)
                }
            );

            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({
                success: false,
                error: 'Failed to execute tool'
            });
        } finally {
            setTesting(false);
        }
    }

    return (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white">Test Tool</h3>

            {/* Input Fields */}
            <div className="space-y-3">
                {Object.entries(properties).map(([key, prop]: [string, any]) => (
                    <Input
                        key={key}
                        label={`${key}${required.includes(key) ? ' *' : ''}`}
                        placeholder={prop.description || key}
                        value={inputs[key] || ''}
                        onChange={(e) => setInputs({ ...inputs, [key]: e.target.value })}
                    />
                ))}
            </div>

            {/* Test Button */}
            <Button onClick={handleTest} disabled={testing} className="w-full">
                {testing ? (
                    <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                    </>
                ) : (
                    <>
                        <Play className="w-4 h-4 mr-2" />
                        Test Tool
                    </>
                )}
            </Button>

            {/* Result Display */}
            {result && (
                <div className={`p-4 rounded-lg ${
                    result.success 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">
                            {result.success ? '✓ Success' : '✗ Error'}
                        </span>
                        {result.execution_time_ms !== undefined && (
                            <span className="text-xs text-gray-500">
                                {result.execution_time_ms}ms
                            </span>
                        )}
                    </div>
                    <pre className="text-sm overflow-auto max-h-48 bg-white dark:bg-gray-900 p-2 rounded">
                        {JSON.stringify(result.success ? result.output : result.error, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
```

2. **Add to project builder page**
```typescript
// In ToolEditor component, add a tab for testing
<Tabs>
  <Tab label="Configure">
    <SchemaBuilder ... />
  </Tab>
  <Tab label="Test">
    <ToolTester projectId={projectId} tool={tool} />
  </Tab>
</Tabs>
```

#### Success Metrics
- 70%+ of users test at least one tool
- Average 3+ tests per project
- 50% reduction in "exported code doesn't work" complaints

---

### Priority 2: Enhanced Validation (Week 1)

#### What It Does
- Real-time schema validation
- Catch Python syntax errors
- Validate API endpoints
- Check for common mistakes

#### Implementation

1. **Add validation endpoint**
```python
@router.post("/{project_id}/validate")
def validate_project(project_id: int, db: Session = Depends(get_db)):
    """Comprehensive project validation"""
    errors = []
    warnings = []
    
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    tools = db.query(models.Tool).filter(models.Tool.project_id == project_id).all()
    
    # Check for duplicate tool names
    tool_names = [t.name for t in tools]
    duplicates = [name for name in tool_names if tool_names.count(name) > 1]
    if duplicates:
        errors.append(f"Duplicate tool names: {', '.join(set(duplicates))}")
    
    # Validate each tool
    for tool in tools:
        # Check Python identifier
        if not tool.name.replace('_', '').isalnum():
            errors.append(f"{tool.name}: Invalid Python function name")
        
        # Check API endpoints
        if tool.handler_type == "api":
            if not tool.handler_code:
                errors.append(f"{tool.name}: Missing API endpoint")
            elif not tool.handler_code.startswith(('http://', 'https://')):
                warnings.append(f"{tool.name}: API endpoint should start with http:// or https://")
        
        # Validate schema
        if tool.input_schema:
            try:
                schema = json.loads(tool.input_schema)
                if not isinstance(schema, dict):
                    errors.append(f"{tool.name}: Invalid schema format")
            except:
                errors.append(f"{tool.name}: Invalid JSON in schema")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }
```

---

### Priority 3: Hot Reload (Week 2)

#### What It Does
- Auto-regenerate code on changes
- Update preview in real-time
- No manual save needed

#### Implementation

1. **Add WebSocket support**
```python
from fastapi import WebSocket

@app.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: int):
    await websocket.accept()
    
    # Listen for changes and push updates
    while True:
        data = await websocket.receive_text()
        # Regenerate code
        # Send back to client
        await websocket.send_text(generated_code)
```

2. **Frontend WebSocket client**
```typescript
const ws = new WebSocket(`ws://localhost:8000/ws/${projectId}`);

ws.onmessage = (event) => {
    setGeneratedCode(event.data);
};

// Send changes
ws.send(JSON.stringify({ tool: updatedTool }));
```

---

### Priority 4: MCP Message Debugger (Week 3)

#### What It Does
- Show raw MCP protocol messages
- Timeline view of communication
- Inspect request/response

#### Implementation

1. **Capture MCP messages**
```python
class MCPMessageLogger:
    def __init__(self):
        self.messages = []
    
    def log(self, message_type, data):
        self.messages.append({
            "timestamp": datetime.utcnow().isoformat(),
            "type": message_type,
            "data": data
        })
    
    def get_messages(self):
        return self.messages
```

2. **UI Timeline Component**
```typescript
<Timeline>
  {messages.map(msg => (
    <TimelineItem
      timestamp={msg.timestamp}
      type={msg.type}
      data={msg.data}
    />
  ))}
</Timeline>
```

---

### Priority 5: Browser Runtime (Week 4-5)

#### Option A: Pyodide (Browser-based Python)

**Pros:**
- Runs entirely in browser
- No server costs
- Instant execution

**Cons:**
- Limited package support
- No real network requests
- Memory constraints

**Implementation:**
```typescript
import { loadPyodide } from 'pyodide';

const pyodide = await loadPyodide();
await pyodide.loadPackage('micropip');

// Run user code
const result = await pyodide.runPythonAsync(`
${generatedServerCode}

# Call tool
result = tool_function(${JSON.stringify(inputs)})
result
`);
```

#### Option B: Server-side Containers

**Pros:**
- Full Python environment
- Real network access
- No limitations

**Cons:**
- Server costs
- Security complexity
- Slower execution

**Implementation:**
```python
import docker

client = docker.from_env()

# Create container per user session
container = client.containers.run(
    "python:3.11-slim",
    command=f"python -c '{user_code}'",
    detach=True,
    mem_limit="128m",
    cpu_period=100000,
    cpu_quota=50000,  # 50% CPU
    network_disabled=False,
    remove=True
)

# Get output
output = container.logs()
```

---

### Priority 6: AI Auto-Fix (Week 6)

#### What It Does
- Detect errors automatically
- Suggest fixes
- Auto-apply corrections

#### Implementation

```python
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/{project_id}/tools/{tool_id}/fix")
async def suggest_fix(project_id: int, tool_id: int, error: str, db: Session = Depends(get_db)):
    """Use AI to suggest fixes for errors"""
    
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    
    prompt = f"""
    Tool: {tool.name}
    Description: {tool.description}
    Input Schema: {tool.input_schema}
    Handler Type: {tool.handler_type}
    Handler Code: {tool.handler_code}
    
    Error: {error}
    
    Suggest a fix for this error. Return only the corrected code.
    """
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    suggestion = response.choices[0].message.content
    
    return {"suggestion": suggestion}
```

---

## Technical Architecture

### New Backend Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── sandbox.py       # NEW: Tool execution
│   │   ├── validation.py    # NEW: Enhanced validation
│   │   ├── websocket.py     # NEW: Real-time updates
│   │   └── ai.py           # NEW: AI suggestions
│   ├── sandbox/
│   │   ├── executor.py     # Code execution engine
│   │   ├── docker.py       # Container management
│   │   └── pyodide.py      # Browser runtime
│   └── utils/
│       ├── mcp_logger.py   # MCP message capture
│       └── validator.py    # Schema validation
```

### New Frontend Structure
```
frontend/src/
├── components/
│   ├── ToolTester.tsx      # NEW: Test UI
│   ├── MCPDebugger.tsx     # NEW: Message timeline
│   ├── AIAssistant.tsx     # NEW: Fix suggestions
│   └── RuntimeConsole.tsx  # NEW: Live output
└── hooks/
    ├── useWebSocket.ts     # Real-time updates
    └── useSandbox.ts       # Sandbox state
```

---

## Cost Estimates

| Feature | Free Tier | Paid (100 users) |
|---------|-----------|------------------|
| Tool Simulator | $0 | $20/month |
| Validation | $0 | $0 |
| Hot Reload | $0 | $0 |
| MCP Debugger | $0 | $0 |
| Browser Runtime | $0 | $0 |
| Docker Containers | $0 (750 hrs) | $50/month |
| AI Suggestions | $0 (Gemini) | $100/month (GPT-4) |
| **Total** | **$0** | **$170/month** |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Users who test tools | 80% |
| Average tests per project | 5+ |
| Time to first working server | <10 min |
| Error rate on export | <5% |
| User satisfaction | 4.5/5 |

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Pyodide limitations | High | Medium | Offer server-side option |
| Docker security | Medium | High | Strict resource limits, sandboxing |
| AI costs | Medium | Medium | Use free tier, rate limit |
| Complexity creep | High | High | Build incrementally, test each feature |

---

## Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Tool Simulator + Validation | Users can test tools |
| 2 | Hot Reload | Real-time code updates |
| 3 | MCP Debugger | Message timeline view |
| 4-5 | Browser Runtime | In-browser execution |
| 6 | AI Auto-Fix | Error suggestions |

---

## Decision Points

### Week 2: Runtime Choice
- **If Pyodide works:** Continue with browser runtime
- **If Pyodide fails:** Switch to Docker containers

### Week 4: AI Provider
- **If budget allows:** Use GPT-4
- **If free tier needed:** Use Gemini/Groq

### Week 6: Launch Decision
- **If all features work:** Full Phase 2 launch
- **If issues remain:** Launch with Simulator + Validation only

---

## Post-Phase 2 Ideas

- **Phase 3:** Hosted MCP servers (run servers for users)
- **Phase 4:** Marketplace (share/sell MCP servers)
- **Phase 5:** Team collaboration (multi-user projects)
- **Phase 6:** CI/CD integration (auto-deploy on git push)

---

## Notes

- Start with Tool Simulator — it's the highest value
- Don't build everything at once
- Get user feedback after each feature
- Be ready to pivot based on usage data
