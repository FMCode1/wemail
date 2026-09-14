"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

export default function RichTextEditor({
  content,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),

      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      

      Underline,
    ],

    content: content || "<p></p>",

    immediatelyRender: false,

    editorProps: {
        attributes: {
          class:
            "min-h-[250px] p-4 outline-none cursor-text",
        },
      },      

      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      
        setTimeout(() => {
          const links = document.querySelectorAll(
            ".ProseMirror a"
          );
      
          links.forEach((link) => {
            const href = link.getAttribute("href");
      
            if (href) {
              link.setAttribute("title", href);
            }
          });
        }, 0);
      },      
  });

  if (!editor) {
    return null;
  }

  const addLinkTooltips = () => {
    const links = document.querySelectorAll(
      ".ProseMirror a"
    );
  
    links.forEach((link) => {
      const href = link.getAttribute("href");
  
      if (href) {
        link.setAttribute("title", href);
      }
    });
  };  

  const buttonClass = (active: boolean) =>
    `rounded px-3 py-1 ${
      active
        ? "bg-black text-white"
        : "bg-white hover:bg-gray-200"
    }`;

    setTimeout(() => {
        const links = document.querySelectorAll(
          ".ProseMirror a"
        );
      
        links.forEach((link) => {
          const href = link.getAttribute("href");
      
          if (href) {
            link.setAttribute("title", href);
          }
        });
      }, 0);      

  return (

    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b bg-gray-50 p-2">

        {/* Bold */}
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleBold().run();
          }}
          className={buttonClass(editor.isActive("bold"))}
        >
          <strong>B</strong>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleItalic().run();
          }}
          className={buttonClass(editor.isActive("italic"))}
        >
          <em>I</em>
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleUnderline().run();
          }}
          className={buttonClass(editor.isActive("underline"))}
        >
          <u>U</u>
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => {
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run();
          }}
          className={buttonClass(
            editor.isActive("bulletList")
          )}
        >
          • List
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => {
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run();
          }}
          className={buttonClass(
            editor.isActive("orderedList")
          )}
        >
          1. List
        </button>

        {/* Link */}
        <button
        type="button"
        onClick={() => {
            const selectedText = editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            " "
            );

            const currentUrl =
            editor.getAttributes("link").href || "";

            const text = window.prompt(
            "Link Name",
            selectedText || ""
            );

            if (text === null) {
            return;
            }

            const url = window.prompt(
            "URL",
            currentUrl || "https://"
            );

            if (url === null || url.trim() === "") {
            return;
            }

            const cleanText = text.trim();
            const cleanUrl = url.trim();

            if (!cleanText) {
            return;
            }

            // If text is already selected, replace it
            // with the custom linked text.
            if (!editor.state.selection.empty) {
            editor
                .chain()
                .focus()
                .deleteSelection()
                .insertContent({
                type: "text",
                text: cleanText,
                marks: [
                    {
                    type: "link",
                    attrs: {
                        href: cleanUrl,
                        target: "_blank",
                    },
                    },
                ],
                })
                .run();

            return;
            }

            // No selection: insert custom linked text
            // at the current cursor position.
            editor
            .chain()
            .focus()
            .insertContent({
                type: "text",
                text: cleanText,
                marks: [
                {
                    type: "link",
                    attrs: {
                    href: cleanUrl,
                    target: "_blank",
                    },
                },
                ],
            })
            .run();
        }}
        className={buttonClass(editor.isActive("link"))}
        >
        🔗 Link
        </button>

      </div>

      {/* Editor */}
      <div
        onClick={() => editor.chain().focus().run()}
        className="min-h-[250px] cursor-text"
        >
        <style jsx global>{`
            .ProseMirror {
            min-height: 250px;
            outline: none;
            }

            .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin: 0.5rem 0;
            }

            .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin: 0.5rem 0;
            }

            .ProseMirror li {
            margin: 0.25rem 0;
            }

            .ProseMirror a {
            color: #2563eb;
            text-decoration: underline;
            cursor: pointer;
            position: relative;
            }

            .ProseMirror a:hover {
            color: #1d4ed8;
            }


            .ProseMirror p {
            margin: 0.5rem 0;
            }
        `}</style>

        <EditorContent editor={editor} />
        </div>

    </div>
  );
}
