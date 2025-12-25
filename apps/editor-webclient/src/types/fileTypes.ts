import type { ReactNode } from 'react';

export type FileTypeId = 'bpmn' | 'markdown' | 'code';

export type ViewMode = 'editor' | 'preview' | 'split';

export interface FileTypeConfig {
  id: FileTypeId;
  extensions: string[];
  monacoLanguage?: string;
  supportedModes: ViewMode[];
  defaultMode: ViewMode;
  component: React.ComponentType<FileViewerProps>;
  getInitialContent?: () => string;
  getMonacoLanguage?: (fileName: string) => string;
}

export interface FileViewerProps {
  content: string;
  fileName: string;
  language?: string;
  viewMode: ViewMode;
  onContentChange: (content: string) => void;
  onViewModeChange?: (mode: ViewMode) => void;
}

export interface ToolbarButton {
  mode: ViewMode;
  label: string;
  icon: ReactNode;
  title: string;
}
