import React from "react";
import type { Block } from "../state/types";

/* A redline marks what Aurora added and removed, so you read the change instead of comparing two copies. */

type Part = { kind: "same" | "add" | "del"; text: string };

const words = (text: string) => text.match(/\S+\s*/g) ?? [];

/* Longest common subsequence over words. Lesson sections are short, so the simple table is fast enough. */
function diffWords(before: string, after: string): Part[] {
  const a = words(before);
  const b = words(after);
  const key = (w: string) => w.trim();
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = key(a[i]) === key(b[j]) ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const parts: Part[] = [];
  const push = (kind: Part["kind"], text: string) => {
    const last = parts[parts.length - 1];
    if (last?.kind === kind) last.text += text;
    else parts.push({ kind, text });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (key(a[i]) === key(b[j])) {
      push("same", b[j]);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) push("del", a[i++]);
    else push("add", b[j++]);
  }
  while (i < a.length) push("del", a[i++]);
  while (j < b.length) push("add", b[j++]);
  return parts;
}

/* Keeps the space after a marked run outside its highlight, so highlights hug the words. */
function Marked({ parts }: { parts: Part[] }) {
  return (
    <>
      {parts.map((part, index) => {
        const text = part.text.trimEnd();
        const space = part.text.slice(text.length);
        if (part.kind === "same") return <React.Fragment key={index}>{part.text}</React.Fragment>;
        const Tag = part.kind === "add" ? "ins" : "del";
        return (
          <React.Fragment key={index}>
            <Tag className={`au-rl-${part.kind}`}>{text}</Tag>
            {space}
          </React.Fragment>
        );
      })}
    </>
  );
}

const Text = ({ before, after }: { before: string; after: string }) => (
  <Marked parts={diffWords(before, after)} />
);

function listDiff(before: string[], after: string[]) {
  const rows: { kind: Part["kind"]; text: string }[] = [];
  const kept = new Set(before.filter((item) => after.includes(item)));
  let i = 0;
  for (const item of after) {
    while (i < before.length && !kept.has(before[i])) rows.push({ kind: "del", text: before[i++] });
    if (kept.has(item) && before[i] === item) {
      rows.push({ kind: "same", text: item });
      i++;
    } else rows.push({ kind: "add", text: item });
  }
  while (i < before.length) rows.push({ kind: kept.has(before[i]) ? "same" : "del", text: before[i++] });
  return rows;
}

export function Redline({
  before,
  after,
  fallback,
}: {
  before: Block | null;
  after: Block;
  fallback: (block: Block) => React.ReactNode;
}) {
  if (before && (after.type === "intro" || after.type === "paragraph") && (before.type === "intro" || before.type === "paragraph")) {
    return (
      <div className="lesson-intro-text au-redline-body">
        {(before.heading || after.heading) && (
          <h3 className="lesson-heading">
            <Text before={before.heading} after={after.heading} />
          </h3>
        )}
        <p className="lesson-paragraph">
          <Text before={before.text} after={after.text} />
        </p>
      </div>
    );
  }
  if (before && after.type === "features" && before.type === "features") {
    return (
      <div className="lesson-features au-redline-body">
        {(before.heading || after.heading) && (
          <h3 className="lesson-subheading">
            <Text before={before.heading} after={after.heading} />
          </h3>
        )}
        <ul className="feature-list">
          {listDiff(before.items, after.items).map((row, index) => (
            <li key={index} className={`feature au-rl-row ${row.kind}`}>
              {row.kind === "same" ? row.text : row.kind === "add" ? <ins className="au-rl-add">{row.text}</ins> : <del className="au-rl-del">{row.text}</del>}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return <>{fallback(after)}</>;
}
