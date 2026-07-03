import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// Renders tutor markdown (lessons + chat answers) with GFM tables/lists and
// syntax-highlighted fenced code blocks. Styling lives in .prose-tutor (index.css).
export default function Markdown({ children }) {
  return (
    <div className="prose-tutor">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {children || ""}
      </ReactMarkdown>
    </div>
  );
}
