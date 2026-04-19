import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMeetingNotesApi, type NoteSummary } from '@/lib/meeting-notes-api';

function groupByDate(notes: NoteSummary[]): Array<{ label: string; notes: NoteSummary[] }> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 6 * 86400000;

  const buckets: Record<string, NoteSummary[]> = {};
  const order: string[] = [];

  for (const n of notes) {
    const d = new Date(n.createdAt);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    let label: string;
    if (dayStart === today) label = 'Today';
    else if (dayStart === yesterday) label = 'Yesterday';
    else if (dayStart >= weekAgo) label = 'Earlier this week';
    else label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    if (!buckets[label]) {
      buckets[label] = [];
      order.push(label);
    }
    buckets[label].push(n);
  }
  return order.map((label) => ({ label, notes: buckets[label] }));
}

function formatDuration(s: number | null): string {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function MeetingNotesListPage() {
  const api = useMeetingNotesApi();
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.list()
      .then((n) => { if (active) setNotes(n); })
      .catch((e) => { if (active) setError((e as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = groupByDate(notes);

  return (
    <div className="min-h-[calc(100vh-58px)] bg-gradient-to-b from-light via-white to-light-2 pt-[58px]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-space text-2xl md:text-3xl font-extrabold text-ink">Meeting Notes</h1>
            <p className="text-sm text-muted">Recorded meetings with transcripts and photos.</p>
          </div>
          <Link
            to="/meeting-notes/new"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-2 text-white px-4 py-2.5 font-bold text-sm no-underline hover:bg-cyan transition-all whitespace-nowrap"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Meeting
          </Link>
        </div>

        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && (
          <div className="rounded-xl bg-red/5 border border-red/20 px-4 py-2.5 text-sm text-red">
            {error}
          </div>
        )}

        {!loading && !error && notes.length === 0 && (
          <div className="rounded-2xl border border-bdl bg-white p-10 text-center">
            <p className="text-muted mb-4">No meetings yet.</p>
            <Link to="/meeting-notes/new" className="text-cyan-2 font-semibold no-underline">
              Record your first meeting &rarr;
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.label}>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 sticky top-[58px] bg-light/80 backdrop-blur py-2 z-10">
                {g.label}
              </h2>
              <div className="space-y-2">
                {g.notes.map((n) => (
                  <Link
                    key={n.id}
                    to={`/meeting-notes/${n.id}`}
                    className="block rounded-xl border border-bdl bg-white p-4 hover:border-cyan-2 hover:shadow-sm transition-all no-underline"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h3 className="font-semibold text-ink text-sm md:text-base truncate">{n.title}</h3>
                      <span className="text-[11px] text-muted whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {n.preview && (
                      <p className="text-xs text-muted line-clamp-2 mb-2">{n.preview}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted">
                      {n.hasAudio && <span>&#128266; {formatDuration(n.durationSeconds)}</span>}
                      {n.imageCount > 0 && <span>&#128247; {n.imageCount}</span>}
                      <span className="text-muted/60">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
