import { Router } from 'express';
import { mockEffortPoints } from '../data/mockData';

const router = Router();

// Effort Point取得
router.get('/:userId', (req, res) => {
  const totalPoints = mockEffortPoints.reduce((sum, record) => sum + record.points, 0);

  res.json({
    totalPoints,
    weeklyPoints: mockEffortPoints.slice(-7),
    monthlyPoints: mockEffortPoints,
  });
});

// 週間Effort Point取得
router.get('/:userId/weekly', (req, res) => {
  const weeklyPoints = mockEffortPoints.slice(-7);
  res.json(weeklyPoints);
});

export default router;
