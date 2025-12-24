import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current) {
      // Configure marked options
      marked.setOptions({
        breaks: true,
        gfm: true,
      });

      // Parse markdown
      const rawHtml = marked.parse(content) as string;

      // Sanitize HTML to prevent XSS
      const cleanHtml = sanitizeHtml(rawHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'pre', 'code', 'blockquote', 'hr', 'br',
          'input'
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          '*': ['class', 'style'],
          'a': ['href', 'target', 'rel'],
          'img': ['src', 'alt', 'title', 'width', 'height'],
          'input': ['type', 'checked', 'disabled'],
          'code': ['class'],
          'pre': ['class'],
        },
        allowedSchemes: ['http', 'https', 'mailto', 'data'],
      });

      previewRef.current.innerHTML = cleanHtml;
    }
  }, [content]);

  return (
    <div className="h-full w-full overflow-auto bg-[#1e1e1e]">
      <div
        ref={previewRef}
        className="markdown-preview"
        style={{
          padding: '20px',
          maxWidth: '900px',
          margin: '0 auto',
          color: '#d4d4d4',
          lineHeight: '1.6',
          fontSize: '14px',
        }}
      />
      <style>{`
        .markdown-preview h1 {
          font-size: 2em;
          font-weight: 600;
          margin: 0.67em 0;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #404040;
          color: #e0e0e0;
        }
        
        .markdown-preview h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.75em 0 0.5em 0;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #404040;
          color: #e0e0e0;
        }
        
        .markdown-preview h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.75em 0 0.5em 0;
          color: #e0e0e0;
        }
        
        .markdown-preview h4,
        .markdown-preview h5,
        .markdown-preview h6 {
          font-weight: 600;
          margin: 0.75em 0 0.5em 0;
          color: #e0e0e0;
        }
        
        .markdown-preview p {
          margin: 0.75em 0;
        }
        
        .markdown-preview a {
          color: #4a9eff;
          text-decoration: none;
        }
        
        .markdown-preview a:hover {
          text-decoration: underline;
        }
        
        .markdown-preview code {
          background-color: rgba(110, 118, 129, 0.4);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #d4d4d4;
        }
        
        .markdown-preview pre {
          background-color: #1e1e1e;
          border: 1px solid #404040;
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        .markdown-preview pre code {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
          font-size: 0.9em;
          color: #d4d4d4;
        }
        
        .markdown-preview blockquote {
          border-left: 4px solid #404040;
          padding-left: 1em;
          margin: 1em 0;
          color: #858585;
        }
        
        .markdown-preview ul,
        .markdown-preview ol {
          padding-left: 2em;
          margin: 0.75em 0;
        }
        
        .markdown-preview li {
          margin: 0.25em 0;
        }
        
        .markdown-preview table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
        }
        
        .markdown-preview th,
        .markdown-preview td {
          border: 1px solid #404040;
          padding: 8px 12px;
          text-align: left;
        }
        
        .markdown-preview th {
          background-color: #2d2d2d;
          font-weight: 600;
        }
        
        .markdown-preview tr:nth-child(even) {
          background-color: rgba(255, 255, 255, 0.02);
        }
        
        .markdown-preview hr {
          border: none;
          border-top: 1px solid #404040;
          margin: 1.5em 0;
        }
        
        .markdown-preview img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
        }
        
        .markdown-preview input[type="checkbox"] {
          margin-right: 0.5em;
        }
      `}</style>
    </div>
  );
}
