import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, message, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-on-surface-variant" />
      </div>
      <h3 className="text-xl font-section-title text-on-surface mb-2">{title}</h3>
      <p className="text-on-surface-variant mb-6 max-w-md">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
