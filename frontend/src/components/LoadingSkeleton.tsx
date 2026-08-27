import React from 'react';

export function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse w-full">
      <div className="flex gap-4 mb-6">
        <div className="h-8 bg-surface-variant rounded-md w-1/4"></div>
        <div className="h-8 bg-surface-variant rounded-md w-1/4"></div>
        <div className="h-8 bg-surface-variant rounded-md w-1/4"></div>
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-outline-variant pb-3">
            <div className="h-12 bg-surface-variant rounded-md w-1/4"></div>
            <div className="h-12 bg-surface-variant rounded-md w-1/4"></div>
            <div className="h-12 bg-surface-variant rounded-md w-1/4"></div>
            <div className="h-12 bg-surface-variant rounded-md w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
