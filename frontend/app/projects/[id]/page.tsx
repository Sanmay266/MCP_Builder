"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2, Download, CheckCircle } from 'lucide-react';
import { SchemaBuilder } from '@/components/SchemaBuilder';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getProject, getTools, createTool, deleteTool, updateTool, getExportUrl, Project, Tool } from '@/lib/api';

export default function ProjectBuilder() {
    const params = useParams();
    const router = useRouter();
    const projectId = parseInt(params.id as string);

    const [project, setProject] = useState<Project | null>(null);
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedToolId, setSelectedToolId] = useState<number | null>(null);

    // New Tool State
    const [toolName, setToolName] = useState('');
    const [toolDescription, setToolDescription] = useState('');
    const [handlerType, setHandlerType] = useState('static');

    useEffect(() => {
        if (projectId) {
            loadData();
        }
    }, [projectId]);

    async function loadData() {
        try {
            const [projData, toolsData] = await Promise.all([
                getProject(projectId),
                getTools(projectId)
            ]);
            setProject(projData);
            setTools(toolsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddTool(e: React.FormEvent) {
        e.preventDefault();
        if (!toolName.trim()) return;

        try {
            const newTool = await createTool(projectId, {
                name: toolName,
                description: toolDescription,
                handler_type: handlerType,
                input_schema: {}, // Default empty schema
                output_schema: "",
                handler_code: ""
            });

            // Reset form
            setToolName('');
            setToolDescription('');
            setHandlerType('static');

            // Reload tools and select the new tool
            const toolsData = await getTools(projectId);
            setTools(toolsData);
            setSelectedToolId(newTool.id);
        } catch (error) {
            console.error(error);
        }
    }

    async function handleDeleteTool(toolId: number) {
        if (!confirm('Delete this tool?')) return;
        try {
            await deleteTool(projectId, toolId);
            const toolsData = await getTools(projectId);
            setTools(toolsData);
            if (selectedToolId === toolId) {
                setSelectedToolId(null);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleUpdateTool(updatedTool: Tool) {
        try {
            await updateTool(projectId, updatedTool.id, updatedTool);
            // Update the tools state with the modified tool
            setTools(prevTools => prevTools.map(tool =>
                tool.id === updatedTool.id ? updatedTool : tool
            ));
        } catch (error) {
            console.error("Error updating tool:", error);
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!project) return <div className="p-8 text-center">Project not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                        <p className="text-xs text-gray-500">MCP Server Project</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" size="sm" onClick={() => window.open(getExportUrl(projectId), '_blank')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Server
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
                {/* Left Column: Tool List & Add Tool */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Tool</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddTool} className="space-y-4">
                                <Input
                                    label="Tool Name"
                                    placeholder="e.g. calculate_sum"
                                    value={toolName}
                                    onChange={(e) => setToolName(e.target.value)}
                                />
                                <Input
                                    label="Description"
                                    placeholder="What does this tool do?"
                                    value={toolDescription}
                                    onChange={(e) => setToolDescription(e.target.value)}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Handler Type</label>
                                    <select
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                        value={handlerType}
                                        onChange={(e) => setHandlerType(e.target.value)}
                                    >
                                        <option value="static">Static Response</option>
                                        <option value="api">HTTP API Call</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full" disabled={!toolName.trim()}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Tool
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Defined Tools</h3>
                        {tools.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No tools defined yet.</p>
                        )}
                        {tools.map((tool) => (
                            <div
                                key={tool.id}
                                className={`bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center group hover:border-black transition-colors cursor-pointer ${selectedToolId === tool.id ? 'border-black ring-2 ring-black' : 'border-gray-200'}`}
                                onClick={() => setSelectedToolId(tool.id)}
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{tool.name}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{tool.description || 'No description'}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteTool(tool.id); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Tool Configuration */}
                <div className="lg:col-span-2">
                    {tools.find(t => t.id === selectedToolId) ? (
                        <ToolEditor
                            tool={tools.find(t => t.id === selectedToolId)!}
                            onUpdate={handleUpdateTool}
                        />
                    ) : (
                        <Card className="h-full min-h-[500px] flex flex-col justify-center items-center text-center p-12 border-dashed">
                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                <CheckCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Select a tool to configure</h3>
                            <p className="text-gray-500 max-w-md mt-2">
                                Click on a tool from the list on the left to edit its input schema, output description, and handler logic.
                            </p>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}

function ToolEditor({ tool, onUpdate }: { tool: Tool, onUpdate: (tool: Tool) => void }) {
    const [inputSchema, setInputSchema] = useState<any>(tool.input_schema || {});
    const [outputSchema, setOutputSchema] = useState(tool.output_schema || '');
    const [handlerCode, setHandlerCode] = useState(tool.handler_code || '');
    const [saving, setSaving] = useState(false);

    // Update local state when tool changes
    useEffect(() => {
        setInputSchema(tool.input_schema || {});
        setOutputSchema(tool.output_schema || '');
        setHandlerCode(tool.handler_code || '');
    }, [tool.id]);

    async function handleSave() {
        setSaving(true);
        try {
            const updatedTool: Tool = {
                ...tool,
                input_schema: inputSchema,
                output_schema: outputSchema,
                handler_code: handlerCode
            };

            await onUpdate(updatedTool);

        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
                <CardTitle>{tool.name} Configuration</CardTitle>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-6 p-6">
                <SchemaBuilder
                    value={inputSchema}
                    onChange={setInputSchema}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Output Description
                        <span className="ml-2 text-xs text-gray-500 font-normal">What does this tool return?</span>
                    </label>
                    <Input
                        value={outputSchema}
                        onChange={(e) => setOutputSchema(e.target.value)}
                        placeholder="Returns a string containing..."
                    />
                </div>

                {tool.handler_type === 'api' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Endpoint / Handler Logic
                        </label>
                        <textarea
                            className="w-full h-32 font-mono text-sm p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                            value={handlerCode}
                            onChange={(e) => setHandlerCode(e.target.value)}
                            placeholder="https://api.example.com/v1/resource"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
