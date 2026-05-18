import { Editor } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  editor: Editor | null;
  isHtmlMode: boolean;
  onToggleHtml: () => void;
}

export default function Toolbar({ editor, isHtmlMode, onToggleHtml }: Props) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLink, setShowLink] = useState(false);
  const linkAnchorRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Close link popover on outside click
  useEffect(() => {
    if (!showLink) return;
    const handle = (e: MouseEvent) => {
      if (!linkAnchorRef.current?.contains(e.target as Node)) setShowLink(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showLink]);

  useEffect(() => {
    if (showLink) linkInputRef.current?.focus();
  }, [showLink]);

  if (!editor) return <div className="rte-toolbar" />;

  const dis = isHtmlMode;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const headingLevel = (): string => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) return String(i);
    }
    return '0';
  };

  const setFormat = (val: string) => {
    if (val === '0') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setHeading({ level: parseInt(val) as 1|2|3|4|5|6 }).run();
    }
  };

  const openLink = () => {
    setLinkUrl(editor.getAttributes('link').href ?? '');
    setShowLink(true);
  };

  const applyLink = () => {
    const raw = linkUrl.trim();
    if (!raw) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setShowLink(false);
    setLinkUrl('');
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLink(false);
    setLinkUrl('');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rte-toolbar">

      {/* Block format */}
      <select
        className="rte-select"
        value={headingLevel()}
        disabled={dis}
        onChange={e => setFormat(e.target.value)}
      >
        <option value="0">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
        <option value="5">Heading 5</option>
        <option value="6">Heading 6</option>
      </select>

      <span className="rte-divider" />

      {/* Inline marks */}
      <Btn
        className="rte-btn-bold"
        active={editor.isActive('bold')}
        disabled={dis}
        title="Bold (⌘B)"
        onPress={() => editor.chain().focus().toggleBold().run()}
      >B</Btn>
      <Btn
        className="rte-btn-italic"
        active={editor.isActive('italic')}
        disabled={dis}
        title="Italic (⌘I)"
        onPress={() => editor.chain().focus().toggleItalic().run()}
      >I</Btn>
      <Btn
        className="rte-btn-under"
        active={editor.isActive('underline')}
        disabled={dis}
        title="Underline (⌘U)"
        onPress={() => editor.chain().focus().toggleUnderline().run()}
      >U</Btn>
      <Btn
        className="rte-btn-strike"
        active={editor.isActive('strike')}
        disabled={dis}
        title="Strikethrough"
        onPress={() => editor.chain().focus().toggleStrike().run()}
      >S</Btn>
      <Btn
        className="rte-btn-code"
        active={editor.isActive('code')}
        disabled={dis}
        title="Inline Code"
        onPress={() => editor.chain().focus().toggleCode().run()}
      >`</Btn>

      <span className="rte-divider" />

      {/* Super / subscript */}
      <Btn
        active={editor.isActive('superscript')}
        disabled={dis}
        title="Superscript"
        onPress={() => editor.chain().focus().toggleSuperscript().run()}
      >x²</Btn>
      <Btn
        active={editor.isActive('subscript')}
        disabled={dis}
        title="Subscript"
        onPress={() => editor.chain().focus().toggleSubscript().run()}
      >x₂</Btn>

      <span className="rte-divider" />

      {/* Lists, quote, hr */}
      <Btn
        active={editor.isActive('bulletList')}
        disabled={dis}
        title="Bullet List"
        onPress={() => editor.chain().focus().toggleBulletList().run()}
      ><BulletListIcon /></Btn>
      <Btn
        active={editor.isActive('orderedList')}
        disabled={dis}
        title="Ordered List"
        onPress={() => editor.chain().focus().toggleOrderedList().run()}
      ><OrderedListIcon /></Btn>
      <Btn
        active={editor.isActive('blockquote')}
        disabled={dis}
        title="Blockquote"
        onPress={() => editor.chain().focus().toggleBlockquote().run()}
      ><QuoteIcon /></Btn>
      <Btn
        active={false}
        disabled={dis}
        title="Horizontal Rule"
        onPress={() => editor.chain().focus().setHorizontalRule().run()}
      ><HRIcon /></Btn>

      <span className="rte-divider" />

      {/* Link */}
      <div ref={linkAnchorRef} className="rte-link-anchor">
        <Btn
          active={editor.isActive('link')}
          disabled={dis}
          title="Link"
          onPress={openLink}
        ><LinkIcon /></Btn>

        {showLink && (
          <div className="rte-link-popover">
            <input
              ref={linkInputRef}
              type="url"
              className="rte-link-input"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') setShowLink(false);
              }}
            />
            <button
              type="button"
              className="rte-btn rte-btn-text"
              onMouseDown={e => { e.preventDefault(); applyLink(); }}
            >
              Apply
            </button>
            {editor.isActive('link') && (
              <button
                type="button"
                className="rte-btn rte-btn-danger"
                onMouseDown={e => { e.preventDefault(); removeLink(); }}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      <span className="rte-divider" />

      {/* Table */}
      <Btn
        active={false}
        disabled={dis}
        title="Insert Table (3×3)"
        onPress={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      ><TableIcon /></Btn>

      {/* Push HTML toggle to right */}
      <span style={{ flex: 1 }} />

      {/* HTML source toggle */}
      <button
        type="button"
        className={`rte-btn rte-btn-html${isHtmlMode ? ' is-active' : ''}`}
        onMouseDown={e => { e.preventDefault(); onToggleHtml(); }}
        title={isHtmlMode ? 'Switch to Visual Editor' : 'Edit HTML Source'}
      >
        {'</>'}
      </button>
    </div>
  );
}

// ── Shared button wrapper ─────────────────────────────────────────────────

interface BtnProps {
  active: boolean;
  disabled: boolean;
  title?: string;
  onPress: () => void;
  className?: string;
  children: React.ReactNode;
}

function Btn({ active, disabled, title, onPress, className = '', children }: BtnProps) {
  return (
    <button
      type="button"
      className={`rte-btn${active ? ' is-active' : ''}${className ? ` ${className}` : ''}`}
      disabled={disabled}
      title={title}
      onMouseDown={e => { e.preventDefault(); onPress(); }}
    >
      {children}
    </button>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────

function BulletListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <circle cx="2" cy="3.5" r="1.5" />
      <circle cx="2" cy="7.5" r="1.5" />
      <circle cx="2" cy="11.5" r="1.5" />
      <rect x="5" y="2.5" width="9" height="2" rx="1" />
      <rect x="5" y="6.5" width="9" height="2" rx="1" />
      <rect x="5" y="10.5" width="9" height="2" rx="1" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <rect x="0.5" y="2" width="3" height="3" rx="0.5" opacity="0.6" />
      <rect x="0.5" y="6" width="3" height="3" rx="0.5" opacity="0.6" />
      <rect x="0.5" y="10" width="3" height="3" rx="0.5" opacity="0.6" />
      <rect x="5" y="2.5" width="9" height="2" rx="1" />
      <rect x="5" y="6.5" width="9" height="2" rx="1" />
      <rect x="5" y="10.5" width="9" height="2" rx="1" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <rect x="1.5" y="2" width="2" height="11" rx="1" />
      <path d="M5.5 5.5C5.5 4.67 6.17 4 7 4h2.5a.5.5 0 010 1H7a.5.5 0 00-.5.5v1.25H9a.5.5 0 010 1H6.5V9.5A.5.5 0 007 10h2.5a.5.5 0 010 1H7c-.83 0-1.5-.67-1.5-1.5v-4z" />
    </svg>
  );
}

function HRIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="1" y1="7.5" x2="14" y2="7.5" />
      <line x1="1" y1="3.5" x2="4" y2="3.5" />
      <line x1="11" y1="3.5" x2="14" y2="3.5" />
      <line x1="1" y1="11.5" x2="4" y2="11.5" />
      <line x1="11" y1="11.5" x2="14" y2="11.5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9.5a3.5 3.5 0 004.9-.1l1.5-1.5a3.5 3.5 0 00-4.95-4.95L6.4 4.1" />
      <path d="M9 5.5a3.5 3.5 0 00-4.9.1L2.6 7.1a3.5 3.5 0 004.95 4.95L8.6 10.9" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.25">
      <rect x="1" y="1" width="13" height="13" rx="1.5" />
      <line x1="1" y1="5" x2="14" y2="5" />
      <line x1="5" y1="1" x2="5" y2="14" />
      <line x1="10" y1="1" x2="10" y2="14" />
      <line x1="1" y1="10" x2="14" y2="10" />
    </svg>
  );
}
