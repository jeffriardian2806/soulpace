"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/app/telekonsul/actions";
import type { ChatMessage, ChatThread } from "@/lib/telekonsul/types";

type Props = {
  thread: ChatThread;
  initialMessages: ChatMessage[];
  currentUserId: string;
};

export function ChatThreadView({ thread, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-thread-${thread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread.id]);

  // Auto-scroll bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    startTransition(async () => {
      const r = await sendMessageAction(thread.id, text);
      if (!r.ok) {
        setError(r.error ?? "Gagal kirim.");
        return;
      }
      setInput("");
    });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isExpired = thread.status === "closed";

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-2">
        {messages.length === 0 && (
          <div className="py-12 text-center text-xs text-ink/40">
            Belum ada pesan. Kirim pesan pertama untuk mulai sesi.
          </div>
        )}
        <ul className="flex flex-col gap-2">
          {messages.map((m) => {
            const isOwn = m.sender_id === currentUserId;
            return (
              <li key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    isOwn
                      ? "bg-sky-500 text-white"
                      : "bg-white text-ink ring-1 ring-ink/10"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body_text}</p>
                  <p
                    className={`mt-1 text-[10px] ${isOwn ? "text-white/70" : "text-ink/40"}`}
                  >
                    {new Date(m.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Composer */}
      {isExpired ? (
        <div className="border-t border-ink/10 bg-ink/5 p-3 text-center text-xs text-ink/55">
          Sesi udah berakhir{thread.closed_reason === "expired" ? " (window 24 jam habis)" : ""}.
          <br />
          Buka sesi baru ke psikolog ini lewat halaman profile.
        </div>
      ) : (
        <div className="border-t border-ink/10 bg-white p-2">
          {error && (
            <div className="mb-2 rounded-lg bg-rose-50 px-2 py-1 text-[11px] text-rose-800 ring-1 ring-rose-200">
              ⚠️ {error}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Tulis pesan..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-ink/15 bg-white p-2 text-sm text-ink outline-none focus:border-sky-300"
              disabled={pending}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={pending || !input.trim()}
              className="rounded-xl bg-sky-500 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? "..." : "Kirim"}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-ink/40">
            Enter = kirim. Shift+Enter = baris baru. Dilarang share kontak off-platform.
          </p>
        </div>
      )}
    </div>
  );
}
