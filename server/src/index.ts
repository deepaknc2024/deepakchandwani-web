import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config } from './config.js';
import { setupVoiceRelay } from './ws/voice-relay.js';

import healthRouter from './routes/health.js';
import newsRouter from './routes/news.js';
import transcriptRouter from './routes/transcript.js';
import contactRouter from './routes/contact.js';
import authRouter from './routes/auth.js';
import ttsRouter from './routes/tts.js';
import adminRouter from './routes/admin.js';
import meetingNotesRouter from './routes/meeting-notes.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '2mb' }));

// Mount all routes under /api
app.use('/api', healthRouter);
app.use('/api', newsRouter);
app.use('/api', transcriptRouter);
app.use('/api', contactRouter);
app.use('/api', authRouter);
app.use('/api', ttsRouter);
app.use('/api', adminRouter);
app.use('/api', meetingNotesRouter);

const server = createServer(app);

setupVoiceRelay(server);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
