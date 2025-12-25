import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import BpmnJS from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

interface BPMNViewerProps {
  content: string;
  onContentChange?: (content: string) => void;
}

export function BPMNViewer({ content, onContentChange }: BPMNViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnJS | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'visual' | 'xml'>('visual');
  const [xmlContent, setXmlContent] = useState(content);
  const [isModelerReady, setIsModelerReady] = useState(false);

  // Initialize modeler once
  useEffect(() => {
    if (!containerRef.current || modelerRef.current) return;

    const container = containerRef.current;

    try {
      modelerRef.current = new BpmnJS({
        container: container,
        width: '100%',
        height: '100%'
      });

      // Listen for diagram changes
      modelerRef.current.on('commandStack.changed', async () => {
        if (onContentChange && modelerRef.current) {
          try {
            const { xml } = await modelerRef.current.saveXML({ format: true });
            if (xml) {
              onContentChange(xml);
            }
          } catch (err) {
            console.error('Error saving BPMN XML:', err);
          }
        }
      });

      // Mark modeler as ready
      setIsModelerReady(true);
    } catch (initErr) {
      console.error('[BPMNViewer] Error initializing BPMN modeler:', initErr);
      setError('Failed to initialize BPMN editor');
      setLoading(false);
    }

    // Cleanup only on unmount
    return () => {
      if (modelerRef.current) {
        try {
          modelerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying modeler:', err);
        }
        modelerRef.current = null;
      }
      setIsModelerReady(false);
    };
  }, []);

  // Load diagram when content changes or switching back to visual mode
  useEffect(() => {
    const modeler = modelerRef.current;
    
    if (!modeler || !isModelerReady || viewMode !== 'visual') {
      if (viewMode !== 'visual') {
        setLoading(false);
      }
      return;
    }

    const loadDiagram = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!xmlContent || xmlContent.trim() === '') {
          setError('No BPMN content to display');
          setLoading(false);
          return;
        }

        // Validate that content looks like XML
        const trimmedContent = xmlContent.trim();
        if (!trimmedContent.startsWith('<') || !trimmedContent.includes('bpmn')) {
          setError('Invalid BPMN content - must be valid BPMN 2.0 XML');
          setLoading(false);
          return;
        }

        // Clear any existing diagram first
        try {
          await modeler.clear();
        } catch (clearErr) {
          console.warn('Could not clear existing diagram:', clearErr);
        }

        // Add delay before import to ensure container is ready
        await new Promise(resolve => setTimeout(resolve, 50));

        const result = await modeler.importXML(xmlContent);
        
        // Check for warnings
        if (result.warnings && result.warnings.length > 0) {
          console.warn('BPMN import warnings:', result.warnings);
        }
        
        // Mark as loaded immediately - don't wait for zoom
        setLoading(false);
      } catch (err: any) {
        console.error('[BPMNViewer] Error rendering BPMN diagram:', err);
        const errorMessage = err?.message || 'Failed to render BPMN diagram';
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadDiagram();
  }, [xmlContent, viewMode, isModelerReady]);

  // Sync content when switching modes
  useEffect(() => {
    setXmlContent(content);
  }, [content]);

  const handleXmlChange = (value: string | undefined) => {
    if (value !== undefined) {
      setXmlContent(value);
      if (onContentChange) {
        onContentChange(value);
      }
    }
  };

  const handleModeSwitch = (mode: 'visual' | 'xml') => {
    setViewMode(mode);
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* BPMN Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-300 bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">📊 BPMN 2.0</span>
          
          {/* Mode Toggle Buttons */}
          <div className="flex items-center gap-1 border border-gray-300 rounded">
            <button
              onClick={() => handleModeSwitch('visual')}
              className={`px-3 py-1 text-sm transition-colors ${
                viewMode === 'visual'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              style={{ borderRadius: '3px 0 0 3px' }}
            >
              Visual
            </button>
            <button
              onClick={() => handleModeSwitch('xml')}
              className={`px-3 py-1 text-sm transition-colors ${
                viewMode === 'xml'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              style={{ borderRadius: '0 3px 3px 0' }}
            >
              XML
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'visual' && (
            <>
              <button
                onClick={() => {
                  if (modelerRef.current) {
                    try {
                      const canvas = modelerRef.current.get('canvas') as any;
                      const viewbox = canvas.viewbox();
                      
                      if (viewbox && viewbox.inner && 
                          isFinite(viewbox.inner.width) && isFinite(viewbox.inner.height) &&
                          viewbox.inner.width > 0 && viewbox.inner.height > 0) {
                        canvas.zoom('fit-viewport', 'auto');
                      } else {
                        console.warn('Cannot fit viewport - invalid dimensions');
                        canvas.zoom(0.8);
                      }
                    } catch (err) {
                      console.warn('Zoom failed:', err);
                      try {
                        const canvas = modelerRef.current.get('canvas') as any;
                        canvas.zoom(0.8);
                      } catch (fallbackErr) {
                        console.warn('Fallback zoom failed:', fallbackErr);
                      }
                    }
                  }
                }}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Fit to viewport"
              >
                Fit
              </button>
              <button
            onClick={() => {
              if (modelerRef.current) {
                try {
                  const canvas = modelerRef.current.get('canvas') as any;
                  const currentZoom = canvas.zoom();
                  if (isFinite(currentZoom)) {
                    canvas.zoom(currentZoom + 0.1);
                  }
                } catch (err) {
                  console.warn('Zoom failed:', err);
                }
              }
            }}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => {
              if (modelerRef.current) {
                try {
                  const canvas = modelerRef.current.get('canvas') as any;
                  const currentZoom = canvas.zoom();
                  if (isFinite(currentZoom)) {
                    canvas.zoom(currentZoom - 0.1);
                  }
                } catch (err) {
                  console.warn('Zoom failed:', err);
                }
              }
            }}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            title="Zoom out"
          >
            −
          </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Visual BPMN Editor */}
        <div 
          className="w-full h-full"
          style={{ display: viewMode === 'visual' ? 'block' : 'none' }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <div className="text-lg text-gray-600">Loading BPMN diagram...</div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center max-w-md">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="text-lg font-semibold text-red-600 mb-2">Error Loading BPMN</div>
                <div className="text-sm text-gray-600 break-words">{error}</div>
              </div>
            </div>
          )}
          
          <div 
            ref={containerRef} 
            className="w-full h-full"
          />
        </div>
        
        {/* XML Editor */}
        <div 
          className="w-full h-full"
          style={{ display: viewMode === 'xml' ? 'block' : 'none' }}
        >
          <Editor
            height="100%"
            language="xml"
            value={xmlContent}
            theme="vs-dark"
            onChange={handleXmlChange}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
