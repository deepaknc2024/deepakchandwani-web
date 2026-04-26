import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// ── Topic list ──────────────────────────────────────────────────────
router.get('/aryan/topics', async (_req, res) => {
  const r = await query(
    `SELECT topic, COUNT(*)::int AS count FROM aryan.questions GROUP BY topic ORDER BY topic`
  );
  res.json({ ok: true, topics: r.rows });
});

// ── Start a new session ─────────────────────────────────────────────
router.post('/aryan/sessions', async (req, res) => {
  const playerName = (req.body?.player_name || 'Aryan').toString().slice(0, 80);
  const topicFilter = req.body?.topic ? String(req.body.topic).slice(0, 80) : null;
  const target = Math.max(5, Math.min(50, parseInt(req.body?.target_questions, 10) || 10));

  const r = await query(
    `INSERT INTO aryan.sessions (player_name, topic_filter, target_questions)
     VALUES ($1, $2, $3) RETURNING id, started_at`,
    [playerName, topicFilter, target]
  );
  res.json({ ok: true, session_id: r.rows[0].id, started_at: r.rows[0].started_at, target_questions: target });
});

// ── Get next question for a session ─────────────────────────────────
router.get('/aryan/sessions/:id/next', async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  if (!sessionId) return res.status(400).json({ ok: false, error: 'Invalid session id' });

  const sess = await query(`SELECT * FROM aryan.sessions WHERE id=$1`, [sessionId]);
  if (!sess.rows.length) return res.status(404).json({ ok: false, error: 'Session not found' });
  const session = sess.rows[0];

  if (session.status !== 'in_progress') {
    return res.json({ ok: true, done: true, session });
  }
  if (session.questions_answered >= session.target_questions) {
    return res.json({ ok: true, done: true, session });
  }

  const topicClause = session.topic_filter ? `AND topic = $2` : '';
  const params: unknown[] = [sessionId];
  if (session.topic_filter) params.push(session.topic_filter);

  const q = await query(
    `SELECT id, topic, question_text, choices
       FROM aryan.questions
      WHERE id NOT IN (SELECT question_id FROM aryan.answers WHERE session_id = $1)
        ${topicClause}
      ORDER BY RANDOM()
      LIMIT 1`,
    params
  );
  if (!q.rows.length) return res.json({ ok: true, done: true, session });

  res.json({
    ok: true,
    done: false,
    question: q.rows[0],
    progress: { answered: session.questions_answered, target: session.target_questions, correct: session.correct_count },
  });
});

// ── Submit an answer ────────────────────────────────────────────────
router.post('/aryan/sessions/:id/answer', async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  const questionId = parseInt(req.body?.question_id, 10);
  const selectedIndex = req.body?.selected_index === null ? null : parseInt(req.body?.selected_index, 10);
  const timeSeconds = Math.max(0, Math.min(600, parseFloat(req.body?.time_seconds) || 0));

  if (!sessionId || !questionId) {
    return res.status(400).json({ ok: false, error: 'Missing session_id or question_id' });
  }

  const q = await query(`SELECT correct_index, explanation, choices FROM aryan.questions WHERE id=$1`, [questionId]);
  if (!q.rows.length) return res.status(404).json({ ok: false, error: 'Question not found' });
  const correctIndex = q.rows[0].correct_index as number;
  const isCorrect = selectedIndex !== null && selectedIndex === correctIndex;

  await query(
    `INSERT INTO aryan.answers (session_id, question_id, selected_index, is_correct, time_seconds)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, questionId, selectedIndex, isCorrect, timeSeconds]
  );

  // Score: 10 base, +5 if under 10s, -1 per second over 10s capped at 1 minimum if correct
  let scoreDelta = 0;
  if (isCorrect) {
    scoreDelta = 10;
    if (timeSeconds <= 10) scoreDelta += 5;
    else if (timeSeconds > 30) scoreDelta = Math.max(1, 10 - Math.floor((timeSeconds - 30) / 5));
  }

  const upd = await query(
    `UPDATE aryan.sessions
        SET questions_answered = questions_answered + 1,
            correct_count = correct_count + $2,
            total_seconds = total_seconds + $3,
            score = score + $4
      WHERE id = $1
      RETURNING questions_answered, target_questions, correct_count, total_seconds, score`,
    [sessionId, isCorrect ? 1 : 0, timeSeconds, scoreDelta]
  );

  const session = upd.rows[0];
  const finished = session.questions_answered >= session.target_questions;
  if (finished) {
    await query(
      `UPDATE aryan.sessions SET status='completed', ended_at=NOW() WHERE id=$1 AND status='in_progress'`,
      [sessionId]
    );
  }

  res.json({
    ok: true,
    is_correct: isCorrect,
    correct_index: correctIndex,
    explanation: q.rows[0].explanation,
    score_delta: scoreDelta,
    progress: session,
    finished,
  });
});

// ── Force-end a session ─────────────────────────────────────────────
router.post('/aryan/sessions/:id/end', async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  await query(
    `UPDATE aryan.sessions SET status='abandoned', ended_at=NOW() WHERE id=$1 AND status='in_progress'`,
    [sessionId]
  );
  res.json({ ok: true });
});

// ── Distinct player list ────────────────────────────────────────────
router.get('/aryan/players', async (_req, res) => {
  const r = await query(
    `SELECT player_name, COUNT(*)::int AS sessions,
            COALESCE(MAX(started_at), NOW()) AS last_played
       FROM aryan.sessions
      GROUP BY player_name
      ORDER BY sessions DESC, player_name ASC`
  );
  res.json({ ok: true, players: r.rows });
});

// ── Session list (history) with filters ─────────────────────────────
router.get('/aryan/sessions', async (req, res) => {
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit as string, 10) || 30));
  const player = (req.query.player as string | undefined)?.trim() || null;
  const dateFrom = (req.query.date_from as string | undefined) || null;
  const dateTo = (req.query.date_to as string | undefined) || null;
  const sort = (req.query.sort as string | undefined) || 'date_desc';

  const where: string[] = [];
  const params: unknown[] = [];
  if (player) { params.push(player); where.push(`player_name = $${params.length}`); }
  if (dateFrom) { params.push(dateFrom); where.push(`started_at >= $${params.length}::timestamptz`); }
  if (dateTo) { params.push(dateTo); where.push(`started_at < ($${params.length}::timestamptz + INTERVAL '1 day')`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const orderMap: Record<string, string> = {
    date_desc: 'started_at DESC',
    date_asc: 'started_at ASC',
    score_desc: 'score DESC, started_at DESC',
    score_asc: 'score ASC, started_at DESC',
    accuracy_desc: 'accuracy_pct DESC, started_at DESC',
    accuracy_asc: 'accuracy_pct ASC, started_at DESC',
    player_asc: 'player_name ASC, started_at DESC',
  };
  const orderBy = orderMap[sort] || orderMap.date_desc;

  params.push(limit);
  const r = await query(
    `SELECT id, player_name, topic_filter, target_questions, questions_answered,
            correct_count, total_seconds, score, status, started_at, ended_at,
            CASE WHEN questions_answered>0
                 THEN ROUND(100.0 * correct_count / questions_answered)::int
                 ELSE 0 END AS accuracy_pct,
            CASE WHEN questions_answered>0
                 THEN ROUND(total_seconds / questions_answered, 1)
                 ELSE 0 END AS avg_seconds_per_q
       FROM aryan.sessions
       ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${params.length}`,
    params
  );
  res.json({ ok: true, sessions: r.rows });
});

// ── Aggregate stats ─────────────────────────────────────────────────
router.get('/aryan/stats', async (_req, res) => {
  const overall = await query(
    `SELECT COUNT(*)::int AS sessions,
            COALESCE(SUM(questions_answered),0)::int AS total_answered,
            COALESCE(SUM(correct_count),0)::int AS total_correct,
            COALESCE(SUM(score),0)::int AS total_score,
            COALESCE(MAX(score),0)::int AS best_score
       FROM aryan.sessions WHERE status='completed'`
  );
  const byTopic = await query(
    `SELECT q.topic,
            COUNT(*)::int AS attempts,
            SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS correct,
            ROUND(100.0 * SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) / COUNT(*))::int AS accuracy_pct,
            ROUND(AVG(a.time_seconds)::numeric, 1)::float AS avg_seconds
       FROM aryan.answers a JOIN aryan.questions q ON q.id=a.question_id
       GROUP BY q.topic ORDER BY q.topic`
  );
  res.json({ ok: true, overall: overall.rows[0], by_topic: byTopic.rows });
});

// ── Session detail (review answers) ─────────────────────────────────
router.get('/aryan/sessions/:id', async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  const sess = await query(`SELECT * FROM aryan.sessions WHERE id=$1`, [sessionId]);
  if (!sess.rows.length) return res.status(404).json({ ok: false, error: 'Not found' });

  const answers = await query(
    `SELECT a.id, a.selected_index, a.is_correct, a.time_seconds, a.answered_at,
            q.id AS question_id, q.topic, q.question_text, q.choices, q.correct_index, q.explanation
       FROM aryan.answers a
       JOIN aryan.questions q ON q.id = a.question_id
      WHERE a.session_id = $1
      ORDER BY a.answered_at ASC`,
    [sessionId]
  );
  res.json({ ok: true, session: sess.rows[0], answers: answers.rows });
});

export default router;
