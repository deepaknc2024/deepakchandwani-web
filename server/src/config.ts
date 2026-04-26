import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'portfolio',
    user: process.env.DB_USER || 'portfolio',
    password: process.env.DB_PASSWORD || '',
  },

  session: {
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
    maxAge: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
  },

  guardianApiKey: process.env.GUARDIAN_API_KEY || 'test',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  sarvamApiKey: process.env.SARVAM_API_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  contactEmail: process.env.CONTACT_EMAIL || 'deepakchandwani@yahoo.com',
  ytdlpPath: process.env.YTDLP_PATH || 'yt-dlp',
  ytdlpCookiesPath: process.env.YTDLP_COOKIES_PATH || '/opt/deepakchandwani-web/youtube-cookies.txt',
};
