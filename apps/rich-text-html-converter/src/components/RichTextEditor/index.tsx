import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RawHtmlBlock } from './RawHtmlBlock';
import { postprocessHtml, preprocessHtml } from './htmlPreprocess';
import Toolbar from './Toolbar';
import './editor.css';

interface Props {
  initialHtml: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ initialHtml, onChange }: Props) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  // htmlSource always holds the clean, human-readable HTML (no internal markers)
  const [htmlSource, setHtmlSource] = useState(initialHtml);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const notify = useCallback(
    (html: string) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(html), 400);
    },
    [onChange],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Subscript,
      Superscript,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      RawHtmlBlock,
    ],
    // Wrap unknown top-level elements before TipTap parses them
    content: preprocessHtml(initialHtml || ''),
    onUpdate({ editor }) {
      // Strip internal markers back to clean HTML before exposing outward
      const clean = postprocessHtml(editor.getHTML());
      setHtmlSource(clean);
      notify(clean);
    },
  });

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const toggleMode = () => {
    if (isHtmlMode) {
      // Returning to visual — re-wrap any unknown elements before setContent
      editor?.commands.setContent(preprocessHtml(htmlSource));
    }
    setIsHtmlMode(m => !m);
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setHtmlSource(value);
    notify(value);
  };

  return (
    <div className="rte-wrapper">
      <Toolbar editor={editor} isHtmlMode={isHtmlMode} onToggleHtml={toggleMode} />
      {isHtmlMode ? (
        <textarea
          className="rte-source"
          value={htmlSource}
          onChange={handleSourceChange}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
      ) : (
        <EditorContent editor={editor} className="rte-content" />
      )}
    </div>
  );
}
