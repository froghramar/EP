import type { FileTypeConfig, FileTypeId } from '../types/fileTypes';
import { codeViewerConfig } from '../components/viewers/CodeViewer';
import { markdownViewerConfig } from '../components/viewers/MarkdownViewer';
import { bpmnViewerConfig } from '../components/viewers/BPMNFileViewer';

export class FileTypeRegistry {
  private static configs: FileTypeConfig[] = [
    bpmnViewerConfig,
    markdownViewerConfig,
    codeViewerConfig, // Keep as last (fallback)
  ];

  /**
   * Get file type configuration for a given filename
   */
  static getFileTypeConfig(fileName: string): FileTypeConfig {
    const lowerFileName = fileName.toLowerCase();
    
    // Find matching file type by extension
    const config = this.configs.find((config) => 
      config.extensions.some((ext) => lowerFileName.endsWith(ext))
    );
    
    // Return matching config or fallback to 'code'
    return config || this.configs.find((c) => c.id === 'code')!;
  }

  /**
   * Get Monaco language for a given filename
   */
  static getMonacoLanguage(fileName: string): string {
    const config = this.getFileTypeConfig(fileName);
    return config.getMonacoLanguage?.(fileName) || config.monacoLanguage || 'plaintext';
  }

  /**
   * Get file type ID for a given filename
   */
  static getFileTypeId(fileName: string): FileTypeId {
    return this.getFileTypeConfig(fileName).id;
  }

  /**
   * Check if a file type supports a specific view mode
   */
  static supportsViewMode(fileName: string, mode: string): boolean {
    const config = this.getFileTypeConfig(fileName);
    return config.supportedModes.includes(mode as any);
  }

  /**
   * Get initial content template for a file type
   */
  static getInitialContent(fileName: string): string | undefined {
    const config = this.getFileTypeConfig(fileName);
    return config.getInitialContent?.();
  }

  /**
   * Get all registered file type configs
   */
  static getAllConfigs(): FileTypeConfig[] {
    return this.configs;
  }

  /**
   * Register a new file type configuration
   */
  static registerFileType(config: FileTypeConfig): void {
    // Insert before the fallback 'code' type
    const codeIndex = this.configs.findIndex((c) => c.id === 'code');
    this.configs.splice(codeIndex, 0, config);
  }
}
