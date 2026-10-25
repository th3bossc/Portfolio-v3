import { Fragment } from "react";
import { safeUrl } from "@/lib/content";

function Inline({ text }: { text: string }) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\s)]+\))/g);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("*") && token.endsWith("*")) return <em key={index}>{token.slice(1, -1)}</em>;
    const match = /^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(token);
    if (match && safeUrl.safeParse(match[2]).success) return <a key={index} href={match[2]} target="_blank" rel="noopener noreferrer">{match[1]}</a>;
    return <Fragment key={index}>{token}</Fragment>;
  });
}
/** Deliberately constrained Markdown. HTML is rendered as text, never executed. */
export function Markdown({ text }: { text: string }) {
  return <div className="prose-copy">{text.split(/\n\s*\n/).filter(Boolean).map((block, i) => {
    if (block.split("\n").every((line) => /^- /.test(line))) return <ul key={i}>{block.split("\n").map((line, j) => <li key={j}><Inline text={line.slice(2)} /></li>)}</ul>;
    return <p key={i}><Inline text={block} /></p>;
  })}</div>;
}
