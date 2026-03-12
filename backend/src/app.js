import express from 'express';
import cors from './config/cors.js';
import routes from '../routes/index.js';
import errorHandler from '../middleware/error.middleware.js';
import path from 'path';

const app = express();

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'EduFlow Connect API' });
});

app.get('/', (_req, res) => {
  res.redirect('/health');
});

app.use('/api', routes);

// Error handler (must be last middleware)
app.use(errorHandler);

export default app;
