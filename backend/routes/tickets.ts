import { Router } from 'express';
import { mockActionTickets, mockEffortPoints, ActionTicket } from '../data/mockData';

const router = Router();

// Ticket一覧取得
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const { status } = req.query;

  let tickets = mockActionTickets.filter((t) => t.userId === userId);

  if (status) {
    tickets = tickets.filter((t) => t.status === status);
  }

  res.json(tickets);
});

// Ticket Done申告
router.patch('/:userId/:ticketId/done', (req, res) => {
  const { ticketId } = req.params;
  const ticket = mockActionTickets.find((t) => t.id === ticketId);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  ticket.status = 'done';

  // Effort Point計算
  const pointMap = {
    'primary-normal': 10,
    'primary-minimal': 5,
    'pivot-normal': 7,
    'pivot-minimal': 3,
  };
  const key = `${ticket.goalType}-${ticket.actionLevel}` as keyof typeof pointMap;
  const points = pointMap[key] || 0;

  // 今日の日付
  const today = new Date().toISOString().split('T')[0];
  const existingRecord = mockEffortPoints.find((r) => r.date === today);

  if (existingRecord) {
    existingRecord.points += points;
  } else {
    mockEffortPoints.push({ date: today, points });
  }

  res.json({ ticket, pointsEarned: points });
});

export default router;
