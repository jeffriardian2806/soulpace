import Link from "next/link";
import { togglePelukAction } from "@/app/feed/actions";
import { createReportAction } from "@/app/_actions/report";
import { ReportButton } from "@/components/ReportButton";
import { CRISIS_RESOURCE } from "@/core/crisisResources";
import type { FeedPost } from "@/core/entities/post";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

export function PostCard({
  post,
  peluked,
  canReport = false,
}: {
  post: FeedPost;
  peluked: boolean;
  canReport?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
          {post.authorHandle.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{post.authorHandle}</p>
          <p className="text-xs text-ink/45">
            {timeAgo(post.createdAt)} · {post.categoryName}
          </p>
        </div>
      </div>

      <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
        {post.body}
      </p>

      {post.crisisFlag && (
        <div className="mb-3 rounded-xl bg-sky-50 p-3 text-xs leading-relaxed text-ink/70">
          {CRISIS_RESOURCE.message} Telepon{" "}
          <span className="font-semibold text-ink/80">{CRISIS_RESOURCE.phone}</span>{" "}
          (SEJIWA, gratis 24 jam) atau{" "}
          <a
            href={CRISIS_RESOURCE.url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="font-medium text-sky-600 underline"
          >
            kunjungi healing119.id
          </a>
          .
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-ink/60">
        <form action={togglePelukAction}>
          <input type="hidden" name="post_id" value={post.id} />
          <input type="hidden" name="peluked" value={peluked ? "1" : "0"} />
          <button
            type="submit"
            className={peluked ? "font-semibold text-sky-600" : "text-ink/60"}
          >
            {peluked ? "Dipeluk" : "Peluk"} · {post.pelukCount}
          </button>
        </form>
        <Link href={`/post/${post.id}`} className="hover:underline">
          {post.replyCount} balasan
        </Link>
        <Link href={`/share/${post.id}`} className="hover:underline">
          Bagikan
        </Link>
        {canReport && (
          <span className="ml-auto">
            <ReportButton
              targetType="post"
              targetId={post.id}
              action={createReportAction}
            />
          </span>
        )}
      </div>
    </div>
  );
}
