import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant bg-surface-container-lowest">
      <div className="text-sm text-on-surface-variant font-metadata">
        Página <span className="font-bold text-on-surface">{page}</span> de <span className="font-bold text-on-surface">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-md hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-on-surface"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-md hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-on-surface"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
