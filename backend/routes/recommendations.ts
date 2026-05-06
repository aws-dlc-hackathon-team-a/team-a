import { Router } from 'express';
import { mockActionTickets, ActionTicket } from '../data/mockData';

const router = Router();

// Recommendation生成
router.post('/:userId', (req, res) => {
  const { userId } = req.params;
  const { triggerType } = req.body;

  // モックRecommendation
  const recommendation = {
    recommendationId: `rec-${Date.now()}`,
    message: 'だが、それでいい。今日は軽めの運動から始めてみませんか？',
    options: [
      { id: 'opt-1', text: 'はい、やります', type: 'yes' },
      { id: 'opt-2', text: 'いいえ、今日はやめておきます', type: 'no' },
      { id: 'opt-3', text: '別の提案が欲しい', type: 'pivot' },
      { id: 'opt-4', text: 'もっと簡単なものにしたい', type: 'minimal' },
    ],
  };

  res.json(recommendation);
});

// Recommendation応答
router.post('/:userId/:recommendationId/answer', (req, res) => {
  const { userId } = req.params;
  const { selectedOptionId } = req.body;

  // 応答に応じてAction Ticket生成
  if (selectedOptionId === 'opt-1') {
    const newTicket: ActionTicket = {
      id: `ticket-${Date.now()}`,
      userId,
      action: '10分間のストレッチをする',
      goalType: 'primary',
      actionLevel: 'minimal',
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    mockActionTickets.push(newTicket);

    return res.json({
      message: '素晴らしい！チケットを作成しました。',
      ticket: newTicket,
    });
  }

  res.json({ message: '了解しました。また次の機会に。' });
});

export default router;
