import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

// Render teks Markdown user (bold, italic, heading, list, link) jadi HTML aman.
// react-markdown TIDAK merender HTML mentah -> aman dari XSS.
// remark-breaks: line break tunggal tetap jadi <br> (mirip perilaku teks polos).
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        h1: ({ children }) => <h2 className="mt-4 mb-1 text-lg font-bold text-ink">{children}</h2>,
        h2: ({ children }) => <h3 className="mt-4 mb-1 text-base font-bold text-ink">{children}</h3>,
        h3: ({ children }) => <h4 className="mt-3 mb-1 text-sm font-bold text-ink">{children}</h4>,
        p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-sky-600 underline"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-2 border-sky-200 pl-3 italic text-ink/70">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded bg-ink/5 px-1 py-0.5 text-[0.85em]">{children}</code>
        ),
        hr: () => <hr className="my-4 border-ink/10" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
