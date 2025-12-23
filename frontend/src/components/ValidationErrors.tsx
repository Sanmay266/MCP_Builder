"use client";

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateProject, Tool } from '@/lib/api';

interface ValidationError {
    tool?: string;
    field: string;
    message: string;
}

interface ValidationErrorsProps {
    tools: Tool[];
    projectId?: number;
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

export function ValidationErrors({ tools, projectId }: ValidationErrorsProps) {
    const clientErrors = validateTools(tools);
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        if (!projectId) return;

        const checkServer = async () => {
            setIsValidating(true);
            try {
                const result = await validateProject(projectId);
                setServerErrors(result.errors);
            } catch (e) {
                console.error("Validation failed", e);
            } finally {
                setIsValidating(false);
            }
        };

        const debounce = setTimeout(checkServer, 1000);
        return () => clearTimeout(debounce);
    }, [projectId, tools]);

    const allErrors = [
        ...clientErrors.map(e => `${e.tool ? e.tool + ': ' : ''}${e.message}`),
        ...serverErrors
    ];

    // Deduplicate errors
    const uniqueErrors = Array.from(new Set(allErrors));
    const isValid = uniqueErrors.length === 0;

    return (
        <div className={`rounded-lg p-4 ${isValid ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center gap-2 mb-2">
                {isValid ? (
                    <>
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-green-800 dark:text-green-300">
                            {isValidating ? 'Verifying...' : 'Ready to export'}
                        </span>
                    </>
                ) : (
                    <>
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="font-medium text-red-800 dark:text-red-300">
                            {uniqueErrors.length} issue{uniqueErrors.length > 1 ? 's' : ''} found
                            {isValidating && ' (Verifying...)'}
                        </span>
                    </>
                )}
            </div>

            {!isValid && (
                <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                    {uniqueErrors.map((error, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            <span>{error}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export { validateTools };
export type { ValidationError };
