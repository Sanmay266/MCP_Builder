"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Server, Code, Zap, Layers, Download, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getProjects, createProject, deleteProject, Project } from '@/lib/api';
import { ProjectListSkeleton, Spinner } from '@/components/ui/Skeleton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useToast } from '@/components/ui/Toast';

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load projects', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateProject(e: React.FormEvent) {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        setCreating(true);
        try {
            await createProject(newProjectName);
            setNewProjectName('');
            showToast('Project created successfully!', 'success');
            loadProjects();
        } catch (error) {
            console.error(error);
            showToast('Failed to create project', 'error');
        } finally {
            setCreating(false);
        }
    }

    async function handleDeleteProject(id: number, name: string) {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await deleteProject(id);
            showToast('Project deleted', 'success');
            loadProjects();
        } catch (error) {
            console.error(error);
            showToast('Failed to delete project', 'error');
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
            {/* Navigation */}
            <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white dark:text-black" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">MCPForge</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Button variant="secondary" size="sm" onClick={() => window.open('https://github.com/modelcontextprotocol', '_blank')}>
                            <Code className="w-4 h-4 mr-2" />
                            MCP Docs
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        No-code MCP server builder
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                        Build MCP Servers<br />
                        <span className="text-blue-600 dark:text-blue-400">Without Writing Code</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                        Create Model Context Protocol servers visually. Define tools, configure schemas, 
                        and export production-ready Python code in minutes.
                    </p>
                    
                    {/* Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
                        <div className="flex flex-col items-center p-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3">
                                <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Visual Builder</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Point-and-click tool creation</p>
                        </div>
                        <div className="flex flex-col items-center p-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-3">
                                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">14+ Templates</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pre-built tools ready to use</p>
                        </div>
                        <div className="flex flex-col items-center p-4">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-3">
                                <Download className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Export & Run</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Download working Python code</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Projects Section */}
            <section className="py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Create New Project Card */}
                        <Card className="lg:col-span-1 h-fit bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-white">New Project</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateProject} className="space-y-4">
                                    <Input
                                        placeholder="e.g. Weather Bot, Job Search Agent"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                    />
                                    <Button type="submit" className="w-full" disabled={creating || !newProjectName.trim()}>
                                        {creating ? (
                                            <>
                                                <Spinner className="w-4 h-4 mr-2" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create Project
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Project List */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Projects</h2>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
                            </div>

                            {loading ? (
                                <ProjectListSkeleton />
                            ) : projects.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="grid gap-4">
                                    {projects.map((project) => (
                                        <ProjectCard 
                                            key={project.id} 
                                            project={project} 
                                            onDelete={() => handleDeleteProject(project.id, project.name)} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Server className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Create your first MCP server project to get started. It only takes a minute!
            </p>
        </div>
    );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
    return (
        <Card className="group hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700">
            <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                        <Server className="w-6 h-6" />
                    </div>
                    <div>
                        <Link href={`/projects/${project.id}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {project.name}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Created {new Date(project.created_at).toLocaleDateString()}
                            {project.tools && project.tools.length > 0 && (
                                <span className="ml-2">• {project.tools.length} tool{project.tools.length !== 1 ? 's' : ''}</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/projects/${project.id}`}>
                        <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Open
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.preventDefault(); onDelete(); }} 
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="w-5 h-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
