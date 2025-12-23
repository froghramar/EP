import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizablePanelProps {
  children: ReactNode;
  width: number;
  onResize: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  side: 'left' | 'right';
}

export function ResizablePanel({
  children,
  width,
  onResize,
  minWidth = 150,
  maxWidth = 600,
  side,
}: ResizablePanelProps) {
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = side === 'left' ? e.clientX : window.innerWidth - e.clientX;
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      onResize(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onResize, minWidth, maxWidth, side]);

  return (
    <div
      ref={panelRef}
      className="relative h-full"
      style={{ width: `${width}px` }}
    >
      {children}
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors ${
          side === 'left' ? 'right-0' : 'left-0'
        }`}
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  );
}
