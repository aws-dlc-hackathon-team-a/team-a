import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import ticketsRouter from './routes/tickets';
import recommendationsRouter from './routes/recommendations';
import effortPointsRouter from './routes/effortPoints';

const app = express();
const PORT = 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// ルーティング
app.use('/api/users', usersRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/effort-points', effortPointsRouter);

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock API Server is running' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Mock API Server running at http://localhost:${PORT}/api`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
