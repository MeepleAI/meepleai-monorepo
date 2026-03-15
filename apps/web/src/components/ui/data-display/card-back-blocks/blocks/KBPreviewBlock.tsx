import { memo } from 'react';

interface KBPreviewBlockProps {
  title: string;
  entityColor: string;
  data: {
    type: 'kbPreview';
    docsCount: number;
    chunksCount: number;
    lastQuery?: string;
    indexStatus: string;
  };
}

export const KBPreviewBlock = memo(function KBPreviewBlock({
  title,
  entityColor,
}: KBPreviewBlockProps) {
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
