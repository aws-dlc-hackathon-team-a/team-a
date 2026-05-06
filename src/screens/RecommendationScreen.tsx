import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const RecommendationScreen: React.FC = () => {
  const [step, setStep] = useState<'initial' | 'pivot' | 'minimal'>('initial');
  const addActionTicket = useAppStore((state) => state.addActionTicket);
  const navigate = useNavigate();

  const recommendations = {
    initial: {
      message: 'おい、今日は英語の勉強やってみるか？',
      action: '英語のポッドキャストを15分聞く',
      goalType: 'primary' as const,
      actionLevel: 'normal' as const,
    },
    pivot: {
      message: '英語はきついか。じゃあ筋トレどうだ？',
      action: '腕立て伏せ10回やる',
      goalType: 'pivot' as const,
      actionLevel: 'normal' as const,
    },
    minimal: {
      message: 'それもきついなら、5分だけ外の空気吸いに行こうぜ',
      action: '5分だけ外に出る',
      goalType: 'pivot' as const,
      actionLevel: 'minimal' as const,
    },
  };

  const current = recommendations[step];

  const handleYes = () => {
    addActionTicket({
      action: current.action,
      goalType: current.goalType,
      actionLevel: current.actionLevel,
      status: 'open',
    });
    navigate('/home');
  };

  const handleNo = () => {
    if (step === 'initial') {
      setStep('pivot');
    } else if (step === 'pivot') {
      setStep('minimal');
    } else {
      navigate('/home');
    }
  };

  const handleGoalChange = () => {
    setStep('pivot');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.messageBox}>
          <p style={styles.message}>{current.message}</p>
        </div>

        <div style={styles.actionBox}>
          <h3 style={styles.actionTitle}>提案する行動</h3>
          <p style={styles.actionText}>{current.action}</p>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={handleYes} style={styles.yesButton}>
            やる
          </button>
          <button onClick={handleNo} style={styles.noButton}>
            いいえ（別の方法で）
          </button>
          {step === 'initial' && (
            <button onClick={handleGoalChange} style={styles.changeButton}>
              目標チェンジ
            </button>
          )}
        </div>

        <button onClick={() => navigate('/home')} style={styles.backButton}>
          ホームに戻る
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  messageBox: {
    backgroundColor: '#f0f8ff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  message: {
    fontSize: '18px',
    color: '#333',
    margin: 0,
    lineHeight: 1.6,
  },
  actionBox: {
    marginBottom: '24px',
  },
  actionTitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '8px',
  },
  actionText: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#007AFF',
    margin: 0,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '16px',
  },
  yesButton: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    backgroundColor: '#34C759',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  noButton: {
    padding: '16px',
    fontSize: '16px',
    backgroundColor: '#FF9500',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  changeButton: {
    padding: '16px',
    fontSize: '16px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  backButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
