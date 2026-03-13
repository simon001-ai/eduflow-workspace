import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your assignment...",
  className = ""
}) => {
  const quillRef = React.useRef<ReactQuill>(null);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [
          { 'header': [1, 2, 3, false] },
          'bold', 'italic', 'underline', 'strike'
        ],
        [
          { 'color': [] }, { 'background': [] },
          { 'list': 'ordered'}, { 'list': 'bullet' }
        ],
        [
          { 'indent': '-1'}, { 'indent': '+1' },
          { 'align': [] }
        ],
        [
          'blockquote', 'code-block',
          'link', 'image'
        ],
        ['undo', 'redo', 'clean']
      ],
      handlers: {
        undo: function() {
          const quill = (this as any).quill;
          quill.history.undo();
        },
        redo: function() {
          const quill = (this as any).quill;
          quill.history.redo();
        }
      }
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    },
    keyboard: {
      bindings: {
        tab: {
          key: 9,
          handler: function(range: any, context: any) {
            return true; // Allow default tab behavior
          }
        },
        // Add common shortcuts
        bold: {
          key: 66,
          ctrlKey: true,
          handler: function(range: any, context: any) {
            this.quill.format('bold', !context.format.bold);
          }
        },
        italic: {
          key: 73,
          ctrlKey: true,
          handler: function(range: any, context: any) {
            this.quill.format('italic', !context.format.italic);
          }
        },
        underline: {
          key: 85,
          ctrlKey: true,
          handler: function(range: any, context: any) {
            this.quill.format('underline', !context.format.underline);
          }
        }
      }
    }
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent', 'align',
    'blockquote', 'code-block', 'link', 'image'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{
          minHeight: '400px',
          backgroundColor: 'white'
        }}
      />
      <style>{`
        .ql-toolbar {
          border-top: 1px solid #d1d5db;
          border-left: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 8px 8px 0 0;
          background: #f9fafb;
          padding: 8px;
        }

        .ql-container {
          border: 1px solid #d1d5db;
          border-radius: 0 0 8px 8px;
          min-height: 400px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        }

        .ql-editor {
          font-size: 14px;
          line-height: 1.6;
          padding: 16px;
          color: #111827;
        }

        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
          font-weight: 400;
        }

        .ql-toolbar .ql-picker-label {
          color: #374151;
        }

        .ql-toolbar .ql-stroke {
          stroke: #374151;
        }

        .ql-toolbar .ql-fill {
          fill: #374151;
        }

        .ql-toolbar button:hover,
        .ql-toolbar button:focus {
          background-color: #f3f4f6;
          border-radius: 4px;
        }

        .ql-toolbar button:hover .ql-stroke,
        .ql-toolbar button:focus .ql-stroke {
          stroke: #2563eb;
        }

        .ql-toolbar button:hover .ql-fill,
        .ql-toolbar button:focus .ql-fill {
          fill: #2563eb;
        }

        .ql-toolbar button.ql-active,
        .ql-toolbar .ql-picker-label.ql-active,
        .ql-toolbar .ql-picker-item.ql-selected {
          background-color: #dbeafe;
          color: #2563eb;
        }

        .ql-toolbar button.ql-active .ql-stroke,
        .ql-toolbar .ql-picker-label.ql-active .ql-stroke,
        .ql-toolbar .ql-picker-item.ql-selected .ql-stroke {
          stroke: #2563eb;
        }

        .ql-toolbar button.ql-active .ql-fill,
        .ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .ql-toolbar .ql-picker-item.ql-selected .ql-fill {
          fill: #2563eb;
        }

        .ql-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }

        .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.83em 0;
        }

        .ql-editor h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 1em 0;
        }

        .ql-editor p {
          margin: 0.5em 0;
        }

        .ql-editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 16px 0;
          color: #6b7280;
          font-style: italic;
        }

        .ql-editor pre {
          background: #f3f4f6;
          border-radius: 4px;
          padding: 12px;
          margin: 8px 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          overflow-x: auto;
        }

        .ql-editor code {
          background: #f3f4f6;
          color: #dc2626;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
};