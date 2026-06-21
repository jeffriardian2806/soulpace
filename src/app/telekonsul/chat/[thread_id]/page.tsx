import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getThreadById,
  getMessagesForThread,
  maybeAutoCloseExpiredThread,
} from "@/lib/telekonsul/queries";
import { ChatThreadView } from "@/components/telekonsul/ChatThreadView";

export const metadata = { title: "Chat — Telekonsul" };

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ thread_id: string }>;
}) {
  const { thread_id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/telekonsul/chat/${thread_id}`);

  // Lazy auto-close kalau expired
  await maybeAutoCloseExpiredThread(thread_id);

  const thread = await getThreadById(thread_id, user.id);
  if (!thread) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <Link href="/telekonsul/chat" className="text-sm text-ink/50">
          ← Inbox
        </Link>
        <p className="py-12 text-center text-sm text-ink/50">Thread tidak ditemukan / akses ditolak.</p>
      </main>
    );
  }

  const messages = await getMessagesForThread(thread_id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col bg-sky-50/30">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-ink/10 bg-white px-5 py-3 shadow-sm">
        <Link href="/telekonsul/chat" className="text-sm text-ink/50">
          ←
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-lg">
          🧑‍⚕️
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold text-ink">
            {thread.psikolog?.full_name}
            {thread.psikolog?.gelar && (
              <span className="ml-1 font-normal text-ink/55">, {thread.psikolog.gelar}</span>
            )}
          </p>
          <p className="text-[10px] text-ink/50">
            {thread.status === "active" ? "🟢 Sesi aktif" : "⚪ Sesi berakhir"}
            {thread.session_expires_at && thread.status === "active" && (
              <>
                {" "}· Expired{" "}
                {new Date(thread.session_expires_at).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </>
            )}
          </p>
        </div>
      </header>

      <div className="px-3">
        <ChatThreadView thread={thread} initialMessages={messages} currentUserId={user.id} />
      </div>
    </main>
  );
}
