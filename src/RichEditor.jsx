import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rich-btn${active ? " active" : ""}`}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ value, onChange, placeholder = "Escribí acá..." }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value === "") {
      editor.commands.clearContent();
    }
  }, [value]);

  if (!editor) return null;

  return (
    <div className="rich-editor-wrapper">
      <div className="rich-toolbar">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrita"><b>B</b></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Cursiva"><i>I</i></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Subrayado"><u>U</u></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Tachado"><s>S</s></ToolbarBtn>
        <div className="rich-divider"/>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista">≡</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">1.</ToolbarBtn>
        <div className="rich-divider"/>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Cita">❝</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Código">{"`"}</ToolbarBtn>
        <div className="rich-divider"/>
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Deshacer">↩</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Rehacer">↪</ToolbarBtn>
      </div>
      <EditorContent editor={editor} className="rich-content" />
    </div>
  );
}

export function RichDisplay({ html }) {
  if (!html) return null;
  return <div className="rich-display" dangerouslySetInnerHTML={{ __html: html }} />;
}