import { memo } from 'react';

interface HistoryBlockProps {
  title: string;
  entityColor: string;
  data: {
    type: 'history';
    entries: Array<{ timestamp: string; message: string; sender?: string }>;
  };
}

export const HistoryBlock = memo(function HistoryBlock({ title, entityColor }: HistoryBlockProps) {
  return (
    <div className="px-4 py-2">
      <h4
        className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: `hsl(${entityColor})` }}
      >
        {title}
      </h4>
      <div className="border-t border-white/5 pt-1.5">
        <p className="text-xs text-slate-500">Coming soon</p>
      </div>
    </div>
  );
});
