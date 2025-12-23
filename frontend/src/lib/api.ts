const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Project {
    id: number;
    name: string;
    created_at: string;
    mcp_json?: string;
}

export interface Tool {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    input_schema?: any;
    output_schema?: string;
    handler_type: string;
    handler_code?: string;
}

export async function getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE_URL}/projects/`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
}

export async function createProject(name: string): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
}

export async function getProject(id: number): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
}

export async function deleteProject(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
}

export async function getTools(projectId: number): Promise<Tool[]> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/tools/`);
    if (!res.ok) throw new Error('Failed to fetch tools');
    return res.json();
}

export async function createTool(projectId: number, tool: Omit<Tool, 'id' | 'project_id'>): Promise<Tool> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/tools/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tool),
    });
    if (!res.ok) throw new Error('Failed to create tool');
    return res.json();
}

export async function deleteTool(projectId: number, toolId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/tools/${toolId}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete tool');
}

export async function updateTool(projectId: number, toolId: number, tool: Omit<Tool, 'id' | 'project_id'>): Promise<Tool> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/tools/${toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tool),
    });
    if (!res.ok) throw new Error('Failed to update tool');
    return res.json();
}

export function getExportUrl(projectId: number): string {
    return `${API_BASE_URL}/projects/${projectId}/export`;
}

export async function exportProjectJSON(projectId: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/export-json`);
    if (!res.ok) throw new Error('Failed to export project');
    return res.json();
}

export async function importProjectJSON(projectData: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/projects/import-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
    });
    if (!res.ok) throw new Error('Failed to import project');
    return res.json();
}

export async function validateProject(projectId: number): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/validate`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to validate project');
    return res.json();
}
