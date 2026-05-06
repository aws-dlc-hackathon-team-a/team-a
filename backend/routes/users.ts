import { Router } from 'express';
import { mockProfiles, mockGoals, Profile, Goal } from '../data/mockData';

const router = Router();

// Profile取得
router.get('/:userId/profiles', (req, res) => {
  const { userId } = req.params;
  const profile = mockProfiles.find((p) => p.userId === userId);

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  res.json(profile);
});

// Profile更新
router.put('/:userId/profiles', (req, res) => {
  const { userId } = req.params;
  const updates = req.body;
  const profileIndex = mockProfiles.findIndex((p) => p.userId === userId);

  if (profileIndex === -1) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  mockProfiles[profileIndex] = { ...mockProfiles[profileIndex], ...updates };
  res.json(mockProfiles[profileIndex]);
});

// Goal一覧取得
router.get('/:userId/goals', (req, res) => {
  const { userId } = req.params;
  const goals = mockGoals.filter((g) => g.userId === userId);
  res.json(goals);
});

// Goal追加
router.post('/:userId/goals', (req, res) => {
  const { userId } = req.params;
  const newGoal: Goal = {
    id: `goal-${Date.now()}`,
    userId,
    ...req.body,
  };
  mockGoals.push(newGoal);
  res.status(201).json(newGoal);
});

// Goal更新
router.put('/:userId/goals/:goalId', (req, res) => {
  const { goalId } = req.params;
  const updates = req.body;
  const goalIndex = mockGoals.findIndex((g) => g.id === goalId);

  if (goalIndex === -1) {
    return res.status(404).json({ message: 'Goal not found' });
  }

  mockGoals[goalIndex] = { ...mockGoals[goalIndex], ...updates };
  res.json(mockGoals[goalIndex]);
});

// Goal削除
router.delete('/:userId/goals/:goalId', (req, res) => {
  const { goalId } = req.params;
  const goalIndex = mockGoals.findIndex((g) => g.id === goalId);

  if (goalIndex === -1) {
    return res.status(404).json({ message: 'Goal not found' });
  }

  mockGoals.splice(goalIndex, 1);
  res.status(204).send();
});

// Primary Goal設定
router.patch('/:userId/goals/:goalId/primary', (req, res) => {
  const { userId, goalId } = req.params;

  // 全てのGoalのisPrimaryをfalseに
  mockGoals.forEach((g) => {
    if (g.userId === userId) {
      g.isPrimary = false;
    }
  });

  // 指定されたGoalをPrimaryに
  const goal = mockGoals.find((g) => g.id === goalId);
  if (!goal) {
    return res.status(404).json({ message: 'Goal not found' });
  }

  goal.isPrimary = true;
  goal.priority = 1;
  res.json(goal);
});

export default router;
