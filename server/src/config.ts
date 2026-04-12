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

  guardianApiKey: process.env.GUARDIAN_API_KEY || 'test',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  contactEmail: process.env.CONTACT_EMAIL || 'deepakchandwani@yahoo.com',
};
