import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm ${className}`}>
            {children}
        </div>
    );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`p-6 border-b border-gray-100 dark:border-gray-800 ${className}`}>
            {children}
        </div>
    );
};

export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
            {children}
        </h3>
    );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`p-6 ${className}`}>
            {children}
        </div>
    );
};
