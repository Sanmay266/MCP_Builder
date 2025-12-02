export interface ToolTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    handler_type: string;
    handler_code?: string;
    input_schema: any;
    output_schema: string;
}

export const TOOL_TEMPLATES: ToolTemplate[] = [
    // Web & API Tools
    {
        id: 'web_search',
        name: 'web_search',
        description: 'Search the web and return relevant results',
        category: 'Web & API',
        icon: '🔍',
        handler_type: 'api',
        handler_code: 'https://api.duckduckgo.com/?q={query}&format=json',
        input_schema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query'
                },
                limit: {
                    type: 'integer',
                    description: 'Maximum number of results'
                }
            },
            required: ['query']
        },
        output_schema: 'Returns search results with titles, URLs, and snippets'
    },
    {
        id: 'fetch_url',
        name: 'fetch_url',
        description: 'Fetch content from a URL',
        category: 'Web & API',
        icon: '🌐',
        handler_type: 'api',
        handler_code: '',
        input_schema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'URL to fetch'
                }
            },
            required: ['url']
        },
        output_schema: 'Returns the HTML or text content from the URL'
    },
    {
        id: 'get_weather',
        name: 'get_weather',
        description: 'Get current weather for a location',
        category: 'Web & API',
        icon: '🌤️',
        handler_type: 'api',
        handler_code: 'https://api.openweathermap.org/data/2.5/weather',
        input_schema: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: 'City name'
                },
                units: {
                    type: 'string',
                    enum: ['metric', 'imperial'],
                    description: 'Temperature units'
                }
            },
            required: ['city']
        },
        output_schema: 'Returns temperature, conditions, humidity, and wind speed'
    },

    // File Operations
    {
        id: 'read_file',
        name: 'read_file',
        description: 'Read contents of a file',
        category: 'File Operations',
        icon: '📄',
        handler_type: 'static',
        input_schema: {
            type: 'object',
            properties: {
                file_path: {
                    type: 'string',
                    description: 'Path to the file'
                }
            },
            required: ['file_path']
        },
        output_schema: 'Returns the file contents as text'
    },
    {
        id: 'write_file',
        name: 'write_file',
        description: 'Write content to a file',
        category: 'File Operations',
        icon: '✍️',
        handler_type: 'static',
        input_schema: {
            type: 'object',
            properties: {
                file_path: {
                    type: 'string',
                    description: 'Path where to write the file'
                },
                content: {
                    type: 'string',
                    description: 'Content to write'
                }
            },
            required: ['file_path', 'content']
        },
        output_schema: 'Returns confirmation of file write'
    },
    {
        id: 'list_files',
        name: 'list_files',
        description: 'List files in a directory',
        category: 'File Operations',
        icon: '📁',
        handler_type: 'static',
        input_schema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Directory path'
                },
                pattern: {
                    type: 'string',
                    description: 'File pattern filter (e.g., *.txt)'
                }
            },
            required: ['directory']
        },
        output_schema: 'Returns list of file names and paths'
    },

    // Data & Calculation
    {
        id: 'calculate',
        name: 'calculate',
        description: 'Perform mathematical calculations',
        category: 'Data & Math',
        icon: '🔢',
        handler_type: 'static',
        input_schema: {
            type: 'object',
            properties: {
                expression: {
                    type: 'string',
                    description: 'Mathematical expression to evaluate'
                }
            },
            required: ['expression']
        },
        output_schema: 'Returns the calculated result'
    },
    {
        id: 'convert_units',
        name: 'convert_units',
        description: 'Convert between different units',
        category: 'Data & Math',
        icon: '⚖️',
        handler_type: 'static',
        input_schema: {
            type: 'object',
            properties: {
                value: {
                    type: 'number',
                    description: 'Value to convert'
                },
                from_unit: {
                    type: 'string',
                    description: 'Source unit (e.g., km, lb, celsius)'
                },
                to_unit: {
                    type: 'string',
                    description: 'Target unit (e.g., miles, kg, fahrenheit)'
                }
            },
            required: ['value', 'from_unit', 'to_unit']
        },
        output_schema: 'Returns the converted value'
    },

    // Database
    {
        id: 'query_database',
        name: 'query_database',
        description: 'Execute a database query',
        category: 'Database',
        icon: '🗄️',
        handler_type: 'static',
        input_schema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'SQL query to execute'
                },
                params: {
                    type: 'array',
                    description: 'Query parameters'
                }
            },
            required: ['query']
        },
        output_schema: 'Returns query results as JSON'
    },

    // Communication
    {
        id: 'send_email',
        name: 'send_email',
        description: 'Send an email message',
        category: 'Communication',
        icon: '📧',
        handler_type: 'api',
        handler_code: '',
        input_schema: {
            type: 'object',
            properties: {
                to: {
                    type: 'string',
                    description: 'Recipient email address'
                },
                subject: {
                    type: 'string',
                    description: 'Email subject'
                },
                body: {
                    type: 'string',
                    description: 'Email body content'
                }
            },
            required: ['to', 'subject', 'body']
        },
        output_schema: 'Returns confirmation of email sent'
    },
    {
        id: 'send_notification',
        name: 'send_notification',
        description: 'Send a push notification',
        category: 'Communication',
        icon: '🔔',
        handler_type: 'api',
        handler_code: '',
        input_schema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'Notification title'
                },
                message: {
                    type: 'string',
                    description: 'Notification message'
                },
                priority: {
                    type: 'string',
                    enum: ['low', 'normal', 'high'],
                    description: 'Notification priority'
                }
            },
            required: ['title', 'message']
        },
        output_schema: 'Returns confirmation of notification sent'
    },

    // Utilities
    {
        id: 'generate_uuid',
        name: 'generate_uuid',
        description: 'Generate a unique identifier',
        category: 'Utilities',
        icon: '🆔',
        handler_type: 'static',
        input_schema: {
            type: 'object',
            properties: {}
        },
        output_schema: 'Returns a UUID string'
    },
    {
        id: 'get_timestamp',
        name: 'get_timestamp',
        description: 'Get current timestamp',
        category: 'Utilities',
        icon: '⏰',
        handler_type: 'static',
        input_schema: {
            type: 'object',
            properties: {
                format: {
                    type: 'string',
                    description: 'Timestamp format (iso, unix, custom)'
                }
            }
        },
        output_schema: 'Returns current timestamp in specified format'
    }
];

export const CATEGORIES = [
    'All',
    'Web & API',
    'File Operations',
    'Data & Math',
    'Database',
    'Communication',
    'Utilities'
];
