"use client";

import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface Tool {
    id: number;
    name: string;
    description?: string;
    input_schema?: any;
    handler_type: string;
    handler_code?: string;
}

interface ValidationError {
    tool?: string;
    field: string;
    message: string;
}

interface ValidationErrorsProps {
    tools: Tool[];
}

function validateTools(tools: Tool[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const toolNames = new Set<string>();
    
    if (tools.length === 0) {
        errors.push({
            field: 'tools',
            message: 'At least one tool is required'
        });
        return errors;
    }
    
    for (const tool of tools) {
        // Check for empty name
        if (!tool.name || !tool.name.trim()) {
            errors.push({
                tool: tool.name || 'Unnamed',
                field: 'name',
                message: 'Tool name is required'
            });
        }
        
        // Check for duplicate names
        if (tool.name && toolNames.has(tool.name.toLowerCase())) {
            errors.push({
                tool: tool.name,
                field: 'name',
                message: 'Duplicate tool name'
            });
        }
        toolNames.add(tool.name?.toLowerCase() || '');
        
        // Check for invalid characters in name
        if (tool.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tool.name.replace(/-/g, '_').replace(/ /g, '_'))) {
            errors.push({
                tool: tool.name,
                field: 'name',
                message: 'Tool name must be a valid Python identifier'
            });
        }
        
        // Check API handler has endpoint
        if (tool.handler_type === 'api' && !tool.handler_code?.trim()) {
            errors.push({
                tool: tool.name,
                field: 'handler_code',
                message: 'API endpoint URL is required for API handler type'
            });
        }
    }
    
    return errors;
}

export function ValidationErrors({ tools }: ValidationErrorsProps) {
    const errors = validateTools(tools);
    const isValid = errors.length === 0;
    
    return (
        <div className={`rounded-lg p-4 ${isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
                {isValid ? (
                    <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Ready to export</span>
                    </>
                ) : (
                    <>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-800">{errors.length} issue{errors.length > 1 ? 's' : ''} found</span>
                    </>
                )}
            </div>
            
            {!isValid && (
                <ul className="space-y-1 text-sm text-red-700">
                    {errors.map((error, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            <span>
                                {error.tool && <strong>{error.tool}:</strong>} {error.message}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export { validateTools };
export type { ValidationError };
