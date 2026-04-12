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

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Mount all routes under /api
app.use('/api', healthRouter);
app.use('/api', newsRouter);
app.use('/api', transcriptRouter);
app.use('/api', contactRouter);
app.use('/api', authRouter);

const server = createServer(app);

setupVoiceRelay(server);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
