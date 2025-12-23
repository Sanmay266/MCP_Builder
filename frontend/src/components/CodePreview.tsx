"use client";

import React, { useState } from 'react';
import { Copy, Check, Code, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Tool {
    name: string;
    description?: string;
    input_schema?: any;
    handler_type: string;
    handler_code?: string;
}

interface CodePreviewProps {
    tools: Tool[];
    serverName?: string;
    remoteCode?: string | null;
}

const TYPE_MAP: Record<string, string> = {
    'string': 'str',
    'number': 'float',
    'integer': 'int',
    'boolean': 'bool',
    'array': 'list',
    'object': 'dict',
};

function generateServerCode(tools: Tool[], serverName: string = "My MCP Server"): string {
    let code = `from mcp.server.fastmcp import FastMCP

mcp = FastMCP("${serverName}")

`;

    for (const tool of tools) {
        const funcName = tool.name.replace(/ /g, "_").replace(/-/g, "_").toLowerCase();
        const description = tool.description || 'No description';
        const inputSchema = tool.input_schema || {};
        const handlerType = tool.handler_type || 'static';
        const handlerCode = tool.handler_code || '';

        // Build typed parameters
        const params: string[] = [];
        const paramDocs: string[] = [];
        const properties = inputSchema.properties || {};
        // ... (rest of implementation)
        const required = inputSchema.required || [];

        for (const [paramName, paramDef] of Object.entries(properties) as [string, any][]) {
            const paramType = TYPE_MAP[paramDef.type || 'string'] || 'str';
            const paramDesc = paramDef.description || '';

            if (required.includes(paramName)) {
                params.push(`${paramName}: ${paramType}`);
            } else {
                let defaultVal = '""';
                if (paramType === 'int') defaultVal = '0';
                else if (paramType === 'float') defaultVal = '0.0';
                else if (paramType === 'bool') defaultVal = 'False';
                else if (paramType === 'list') defaultVal = '[]';
                else if (paramType === 'dict') defaultVal = '{}';
                params.push(`${paramName}: ${paramType} = ${defaultVal}`);
            }

            if (paramDesc) {
                paramDocs.push(`        ${paramName}: ${paramDesc}`);
            }
        }

        const paramsStr = params.join(", ");

        // Build docstring
        let docstring = `"""${description}`;
        if (paramDocs.length > 0) {
            docstring += "\n\n    Args:\n" + paramDocs.join("\n");
        }
        docstring += '"""';

        // Build function body
        let body: string;
        if (handlerType === 'api' && handlerCode) {
            body = `    import requests
    response = requests.get("${handlerCode}")
    return response.text`;
        } else {
            body = `    return "Executed ${tool.name}"`;
        }

        code += `@mcp.tool()
def ${funcName}(${paramsStr}) -> str:
    ${docstring}
${body}

`;
    }

    code += `if __name__ == "__main__":
    mcp.run()
`;

    return code;
}

export function CodePreview({ tools, serverName, remoteCode }: CodePreviewProps) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'server' | 'config'>('server');

    // Use remoteCode if available, otherwise generate locally
    const serverCode = remoteCode || generateServerCode(tools, serverName);
    const configJson = JSON.stringify({
        name: serverName || "My MCP Server",
        version: "1.0.0",
        tools: tools.map(t => ({
            name: t.name,
            description: t.description,
            input_schema: t.input_schema
        }))
    }, null, 2);

    const currentCode = activeTab === 'server' ? serverCode : configJson;

    async function handleCopy() {
        await navigator.clipboard.writeText(currentCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('server')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${activeTab === 'server'
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Code className="w-4 h-4" />
                        server.py
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${activeTab === 'config'
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        mcp.json
                    </button>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-white"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-sm text-gray-300 font-mono">
                <code>{currentCode}</code>
            </pre>
        </div>
    );
}
