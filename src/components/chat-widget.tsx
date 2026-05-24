"use client";

import { useState } from "react";
import { Bot, ChevronDown, ExternalLink, Send, Sparkles } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { ChatAnswer } from "@/lib/types";

type Message = { role: "user" | "assistant"; text: string; result?: ChatAnswer };

const prompts = ["Latest NALCO News", "Recent Filings", "Aluminium Market", "Entity Map", "Risk Summary"];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi, I’m your NALCO Intelligence Assistant. Ask me about filings, news, aluminium prices, entities, or policy updates."
    }
  ]);

  async function ask(question: string) {
    if (!question.trim()) return;
    setInput("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", text: question }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question })
      });
      const result = await response.json();
      setMessages((current) => [...current, { role: "assistant", text: result.answer || "I could not verify this from available sources.", result }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "I could not verify this from available sources." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-4 flex h-[620px] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-2xl">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-teal-600"><Bot size={19} /></div>
              <div>
                <div className="text-sm font-bold">NALCO Intelligence Assistant</div>
                <div className="text-xs text-slate-300">Grounded answers with citations</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-white/10" aria-label="Collapse chat"><ChevronDown size={18} /></button>
          </div>
          <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "ml-8 rounded-lg bg-teal-700 p-3 text-sm text-white" : "mr-4 rounded-lg bg-slate-100 p-3 text-sm leading-6 dark:bg-slate-800"}>
                <div className="whitespace-pre-wrap">{message.text}</div>
                {message.result && (
                  <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="info">Confidence {Math.round(message.result.confidence * 100)}%</Badge>
                      <Badge>{message.result.evidenceDateRange}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.result.entities.slice(0, 6).map((entity) => <Badge key={`${index}-${entity.type}-${entity.text}`}>{entity.text}</Badge>)}
                    </div>
                    <div className="space-y-2">
                      {message.result.citations.map((citation, citationIndex) => (
                        <a key={citation.id} href={citation.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded-md border border-[var(--border)] p-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900">
                          <span className="font-bold">[{citationIndex + 1}]</span>
                          <span className="flex-1">{citation.title}<br /><span className="text-[var(--muted)]">{citation.sourceName}</span></span>
                          <ExternalLink size={13} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="mr-12 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800"><Sparkles className="mr-2 inline animate-pulse" size={16} />Reading sources...</div>}
          </div>
          <div className="border-t border-[var(--border)] p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">{prompt}</button>)}
            </div>
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); ask(input); }}>
              <input value={input} onChange={(event) => setInput(event.target.value)} className="h-11 flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--primary)]" placeholder="Ask about NALCO..." />
              <Button className="h-11 w-11 px-0" aria-label="Send"><Send size={17} /></Button>
            </form>
          </div>
        </div>
      )}
      <button onClick={() => setOpen((value) => !value)} className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-2xl transition hover:scale-105" aria-label="Open NALCO assistant">
        <Bot size={25} />
      </button>
    </div>
  );
}
