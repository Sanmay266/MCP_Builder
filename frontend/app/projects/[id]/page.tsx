"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2, Download, CheckCircle, Eye, EyeOff, FileJson } from 'lucide-react';
import { SchemaBuilder } from '@/components/SchemaBuilder';
import { CodePreview } from '@/components/CodePreview';
import { ValidationErrors } from '@/components/ValidationErrors';
import { ToolListSkeleton, Spinner } from '@/components/ui/Skeleton';
import { TemplateLibrary } from '@/components/TemplateLibrary';
import { ToolTester } from '@/components/ToolTester';
import { ToolTemplate } from '@/lib/templates';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getProject, getTools, createTool, deleteTool, updateTool, getExportUrl, exportProjectJSON, Project, Tool } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useWebSocket } from '@/lib/useWebSocket';

export default function ProjectBuilder() {
    const params = useParams();
    const router = useRouter();
    const projectId = parseInt(params.id as string);

    const [project, setProject] = useState<Project | null>(null);
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedToolId, setSelectedToolId] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState(true);
    const [showTemplates, setShowTemplates] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const [codeGenerating, setCodeGenerating] = useState(false);

    // New Tool State
    const [toolName, setToolName] = useState('');
    const [toolDescription, setToolDescription] = useState('');
    const [handlerType, setHandlerType] = useState('static');
    const { showToast } = useToast();

    // Hot Reload: Auto-regenerate code when tools change
    useEffect(() => {
        // Debounce code generation to avoid excessive updates
        const timer = setTimeout(() => {
            if (tools.length > 0) {
                setCodeGenerating(true);
                // Generate code locally for instant feedback
                import('@/components/CodePreview').then(module => {
                    // Code generation happens in CodePreview component
                    setCodeGenerating(false);
                });
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [tools, project?.name]);

    useEffect(() => {
        if (projectId) {
            loadData();
        }
    }, [projectId]);

    // ... (existing loadData and handlers)

    // ... (inside JSX)


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
            showToast('Failed to load project', 'error');
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
            showToast('Tool added successfully', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to add tool', 'error');
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
            showToast('Tool deleted', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete tool', 'error');
        }
    }

    async function handleUpdateTool(updatedTool: Tool) {
        try {
            await updateTool(projectId, updatedTool.id, updatedTool);
            // Update the tools state with the modified tool
            setTools(prevTools => prevTools.map(tool =>
                tool.id === updatedTool.id ? updatedTool : tool
            ));
            showToast('Tool saved', 'success');
        } catch (error) {
            console.error("Error updating tool:", error);
            showToast('Failed to save tool', 'error');
        }
    }

    async function handleSelectTemplate(template: ToolTemplate) {
        try {
            const newTool = await createTool(projectId, {
                name: template.name,
                description: template.description,
                handler_type: template.handler_type,
                input_schema: template.input_schema,
                output_schema: template.output_schema,
                handler_code: template.handler_code || ""
            });

            const toolsData = await getTools(projectId);
            setTools(toolsData);
            setSelectedToolId(newTool.id);
            setShowTemplates(false);
            showToast(`Added "${template.name}" from templates`, 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to add template', 'error');
        }
    }

    async function handleExportJSON() {
        try {
            const data = await exportProjectJSON(projectId);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project?.name || 'project'}-backup.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Project exported as JSON', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to export project', 'error');
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Spinner className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
            </div>
        </div>
    );
    if (!project) return <div className="p-8 text-center dark:text-white">Project not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">MCP Server Project</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-gray-600 dark:text-gray-400"
                    >
                        {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleExportJSON}>
                        <FileJson className="w-4 h-4 mr-2" />
                        Backup
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => window.open(getExportUrl(projectId), '_blank')} disabled={tools.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Server
                    </Button>
                </div>
            </header>

            <main className={`flex-1 p-8 grid grid-cols-1 gap-8 max-w-7xl mx-auto w-full ${showPreview ? 'lg:grid-cols-12' : 'lg:grid-cols-3'}`}>
                {/* Left Column: Tool List & Add Tool */}
                <div className={`space-y-6 ${showPreview ? 'lg:col-span-3' : 'lg:col-span-1'}`}>
                    <ValidationErrors tools={tools} projectId={projectId} />

                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setShowTemplates(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Browse Tool Templates
                    </Button>

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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Handler Type</label>
                                    <select
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
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
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Defined Tools</h3>
                        {tools.length === 0 && (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No tools defined yet.</p>
                        )}
                        {tools.map((tool) => (
                            <div
                                key={tool.id}
                                className={`bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm flex justify-between items-center group hover:border-black dark:hover:border-white transition-colors cursor-pointer ${selectedToolId === tool.id ? 'border-black dark:border-white ring-2 ring-black dark:ring-white' : 'border-gray-200 dark:border-gray-700'}`}
                                onClick={() => setSelectedToolId(tool.id)}
                            >
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{tool.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{tool.description || 'No description'}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteTool(tool.id); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle Column: Tool Configuration */}
                <div className={`${showPreview ? 'lg:col-span-5' : 'lg:col-span-2'}`}>
                    {tools.find(t => t.id === selectedToolId) ? (
                        <ToolEditor
                            tool={tools.find(t => t.id === selectedToolId)!}
                            onUpdate={handleUpdateTool}
                        />
                    ) : (
                        <Card className="h-full min-h-[500px] flex flex-col justify-center items-center text-center p-12 border-dashed">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
                                <CheckCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a tool to configure</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mt-2">
                                Click on a tool from the list on the left to edit its input schema, output description, and handler logic.
                            </p>
                        </Card>
                    )}
                </div>

                {/* Right Column: Code Preview */}
                {showPreview && (
                    <div className="lg:col-span-4 h-[calc(100vh-12rem)]">
                        <div className="relative h-full">
                            {codeGenerating && (
                                <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                    <Spinner className="w-3 h-3" />
                                    Updating...
                                </div>
                            )}
                            <CodePreview tools={tools} serverName={project?.name} />
                        </div>
                    </div>
                )}
            </main>

            {/* Template Library Modal */}
            {showTemplates && (
                <TemplateLibrary
                    onSelect={handleSelectTemplate}
                    onClose={() => setShowTemplates(false)}
                />
            )}
        </div>
    );
}

function ToolEditor({ tool, onUpdate }: { tool: Tool, onUpdate: (tool: Tool) => void }) {
    const [inputSchema, setInputSchema] = useState<any>(tool.input_schema || {});
    const [outputSchema, setOutputSchema] = useState(tool.output_schema || '');
    const [handlerCode, setHandlerCode] = useState(tool.handler_code || '');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'configure' | 'test'>('configure');

    // Update local state when tool changes
    useEffect(() => {
        setInputSchema(tool.input_schema || {});
        setOutputSchema(tool.output_schema || '');
        setHandlerCode(tool.handler_code || '');
    }, [tool.id]);

    // Auto-update tool in parent state for live preview (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            const updatedTool: Tool = {
                ...tool,
                input_schema: inputSchema,
                output_schema: outputSchema,
                handler_code: handlerCode
            };
            
            // Only trigger if something actually changed
            const hasChanges = 
                JSON.stringify(inputSchema) !== JSON.stringify(tool.input_schema) ||
                outputSchema !== tool.output_schema ||
                handlerCode !== tool.handler_code;
            
            if (hasChanges) {
                // Update parent state for preview (without saving to backend)
                onUpdate(updatedTool);
            }
        }, 500); // 500ms debounce for typing

        return () => clearTimeout(timer);
    }, [inputSchema, outputSchema, handlerCode]);

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
        <div className="h-full flex flex-col space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('configure')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'configure'
                        ? 'border-black dark:border-white text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Configure
                </button>
                <button
                    onClick={() => setActiveTab('test')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'test'
                        ? 'border-black dark:border-white text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Test
                </button>
            </div>

            {/* Configure Tab */}
            {activeTab === 'configure' && (
                <Card className="flex-1 flex flex-col">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between">
                        <CardTitle>{tool.name} Configuration</CardTitle>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Spinner className="w-4 h-4 mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-6 p-6">
                        <SchemaBuilder
                            value={inputSchema}
                            onChange={setInputSchema}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Output Description
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">What does this tool return?</span>
                            </label>
                            <Input
                                value={outputSchema}
                                onChange={(e) => setOutputSchema(e.target.value)}
                                placeholder="Returns a string containing..."
                            />
                        </div>

                        {tool.handler_type === 'api' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    API Endpoint / Handler Logic
                                </label>
                                <textarea
                                    className="w-full h-32 font-mono text-sm p-4 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                    value={handlerCode}
                                    onChange={(e) => setHandlerCode(e.target.value)}
                                    placeholder="https://api.example.com/v1/resource"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Test Tab */}
            {activeTab === 'test' && (
                <div className="flex-1 overflow-y-auto">
                    <ToolTester projectId={parseInt(tool.project_id?.toString() || '0')} tool={tool} />
                </div>
            )}
        </div>
    );
}
