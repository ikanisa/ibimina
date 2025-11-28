import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className || ''}`}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${className || ''}`}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={`text-lg font-semibold ${className || ''}`}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={`p-4 ${className || ''}`}>
      {children}
    </div>
  );
}

export function CardDescription({ className, children }: CardProps) {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className || ''}`}>
      {children}
    </p>
  );
}
