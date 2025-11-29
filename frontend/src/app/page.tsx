"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Server, Code } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getProjects, createProject, deleteProject, Project } from '@/lib/api';

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (error) {
            console.error(error);
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
            loadProjects();
        } catch (error) {
            console.error(error);
        } finally {
            setCreating(false);
        }
    }

    async function handleDeleteProject(id: number) {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            await deleteProject(id);
            loadProjects();
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">MCPForge</h1>
                        <p className="text-gray-500 mt-1">Build and export Model Context Protocol servers visually.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => window.open('https://github.com/modelcontextprotocol', '_blank')}>
                            <Code className="w-4 h-4 mr-2" />
                            MCP Docs
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Create New Project Card */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle>New Project</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <Input
                                    placeholder="Project Name"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                />
                                <Button type="submit" className="w-full" disabled={creating || !newProjectName.trim()}>
                                    {creating ? 'Creating...' : (
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
                    <div className="md:col-span-2 space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Projects</h2>

                        {loading ? (
                            <div className="text-center py-10 text-gray-500">Loading projects...</div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
                                No projects yet. Create one to get started.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {projects.map((project) => (
                                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="flex items-center justify-between p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                                    <Server className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <Link href={`/projects/${project.id}`} className="text-lg font-medium text-gray-900 hover:underline">
                                                        {project.name}
                                                    </Link>
                                                    <p className="text-sm text-gray-500">
                                                        Created {new Date(project.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteProject(project.id)} className="text-gray-400 hover:text-red-600">
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
