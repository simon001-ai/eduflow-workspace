import cors from 'cors';
import { env } from './env.js';

const origin = env.corsOrigin;
const allowedOrigins = origin.split(',').map((o) => o.trim()).filter(Boolean);

export const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default cors(corsOptions);
