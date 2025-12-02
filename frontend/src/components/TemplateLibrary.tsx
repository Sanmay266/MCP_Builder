"use client";

import React, { useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TOOL_TEMPLATES, CATEGORIES, ToolTemplate } from '@/lib/templates';

interface TemplateLibraryProps {
    onSelect: (template: ToolTemplate) => void;
    onClose: () => void;
}

export function TemplateLibrary({ onSelect, onClose }: TemplateLibraryProps) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTemplates = TOOL_TEMPLATES.filter(template => {
        const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Tool Templates</h2>
                        <p className="text-sm text-gray-500 mt-1">Choose from pre-built tools to get started quickly</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="p-6 border-b space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedCategory === category
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No templates found matching your criteria
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredTemplates.map(template => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onSelect={() => onSelect(template)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface TemplateCardProps {
    template: ToolTemplate;
    onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-black hover:shadow-md transition-all group">
            <div className="flex items-start gap-3">
                <div className="text-3xl">{template.icon}</div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {template.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                            {Object.keys(template.input_schema.properties || {}).length} params
                        </span>
                    </div>
                </div>
            </div>
            <Button
                size="sm"
                onClick={onSelect}
                className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Plus className="w-4 h-4 mr-1" />
                Add Tool
            </Button>
        </div>
    );
}
