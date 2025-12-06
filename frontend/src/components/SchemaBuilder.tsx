"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SchemaProperty {
    id: string;
    name: string;
    type: string;
    description: string;
    required: boolean;
    enumValues?: string;
}

interface SchemaBuilderProps {
    value: any;
    onChange: (schema: any) => void;
}

const TYPES = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'integer', label: 'Integer' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'array', label: 'Array' },
    { value: 'object', label: 'Object' },
];

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

function schemaToProperties(schema: any): SchemaProperty[] {
    if (!schema || !schema.properties) return [];
    
    const required = schema.required || [];
    return Object.entries(schema.properties).map(([name, prop]: [string, any]) => ({
        id: generateId(),
        name,
        type: prop.type || 'string',
        description: prop.description || '',
        required: required.includes(name),
        enumValues: prop.enum ? prop.enum.join(', ') : '',
    }));
}

function propertiesToSchema(properties: SchemaProperty[]): any {
    if (properties.length === 0) return {};
    
    const schema: any = {
        type: 'object',
        properties: {},
        required: [],
    };

    properties.forEach(prop => {
        if (!prop.name.trim()) return;
        
        const propDef: any = {
            type: prop.type,
        };
        
        if (prop.description) {
            propDef.description = prop.description;
        }
        
        if (prop.enumValues && prop.type === 'string') {
            propDef.enum = prop.enumValues.split(',').map(v => v.trim()).filter(Boolean);
        }
        
        schema.properties[prop.name] = propDef;
        
        if (prop.required) {
            schema.required.push(prop.name);
        }
    });
    
    if (schema.required.length === 0) {
        delete schema.required;
    }
    
    return schema;
}

export function SchemaBuilder({ value, onChange }: SchemaBuilderProps) {
    const [properties, setProperties] = useState<SchemaProperty[]>([]);
    const [showRawJson, setShowRawJson] = useState(false);
    const [rawJson, setRawJson] = useState('');

    useEffect(() => {
        const props = schemaToProperties(value);
        setProperties(props);
        setRawJson(JSON.stringify(value || {}, null, 2));
    }, []);

    function updateAndNotify(newProps: SchemaProperty[]) {
        setProperties(newProps);
        const schema = propertiesToSchema(newProps);
        onChange(schema);
        setRawJson(JSON.stringify(schema, null, 2));
    }

    function addProperty() {
        const newProp: SchemaProperty = {
            id: generateId(),
            name: '',
            type: 'string',
            description: '',
            required: false,
            enumValues: '',
        };
        updateAndNotify([...properties, newProp]);
    }

    function updateProperty(id: string, field: keyof SchemaProperty, value: any) {
        const newProps = properties.map(p => 
            p.id === id ? { ...p, [field]: value } : p
        );
        updateAndNotify(newProps);
    }

    function removeProperty(id: string) {
        updateAndNotify(properties.filter(p => p.id !== id));
    }

    function handleRawJsonChange(json: string) {
        setRawJson(json);
        try {
            const parsed = JSON.parse(json);
            const props = schemaToProperties(parsed);
            setProperties(props);
            onChange(parsed);
        } catch {
            // Invalid JSON, don't update
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Input Parameters
                </label>
                <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                >
                    {showRawJson ? 'Visual Editor' : 'Raw JSON'}
                </button>
            </div>

            {showRawJson ? (
                <textarea
                    className="w-full h-48 font-mono text-sm p-4 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    value={rawJson}
                    onChange={(e) => handleRawJsonChange(e.target.value)}
                    placeholder='{ "type": "object", "properties": { ... } }'
                />
            ) : (
                <div className="space-y-3">
                    {properties.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No parameters defined</p>
                            <Button type="button" size="sm" onClick={addProperty}>
                                <Plus className="w-4 h-4 mr-1" />
                                Add Parameter
                            </Button>
                        </div>
                    ) : (
                        <>
                            {properties.map((prop) => (
                                <PropertyRow
                                    key={prop.id}
                                    property={prop}
                                    onUpdate={(field, value) => updateProperty(prop.id, field, value)}
                                    onRemove={() => removeProperty(prop.id)}
                                />
                            ))}
                            <Button type="button" variant="secondary" size="sm" onClick={addProperty} className="w-full">
                                <Plus className="w-4 h-4 mr-1" />
                                Add Parameter
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}


interface PropertyRowProps {
    property: SchemaProperty;
    onUpdate: (field: keyof SchemaProperty, value: any) => void;
    onRemove: () => void;
}

function PropertyRow({ property, onUpdate, onRemove }: PropertyRowProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                
                <input
                    type="text"
                    placeholder="Parameter name"
                    value={property.name}
                    onChange={(e) => onUpdate('name', e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
                
                <select
                    value={property.type}
                    onChange={(e) => onUpdate('type', e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                    {TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
                
                <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <input
                        type="checkbox"
                        checked={property.required}
                        onChange={(e) => onUpdate('required', e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                    />
                    Required
                </label>
                
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2"
                >
                    {expanded ? 'Less' : 'More'}
                </button>
                
                <button
                    type="button"
                    onClick={onRemove}
                    className="p-1 text-gray-400 hover:text-red-600"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            
            {expanded && (
                <div className="pl-6 space-y-2">
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        value={property.description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                    
                    {property.type === 'string' && (
                        <input
                            type="text"
                            placeholder="Enum values (comma-separated, optional)"
                            value={property.enumValues || ''}
                            onChange={(e) => onUpdate('enumValues', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
