import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [interests, setInterests] = useState('');
  const [lifeRhythm, setLifeRhythm] = useState<'morning' | 'night'>('morning');
  const [concerns, setConcerns] = useState('');
  
  const setProfile = useAppStore((state) => state.setProfile);
  const addGoal = useAppStore((state) => state.addGoal);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // プロフィール保存
      setProfile({
        nickname,
        age: parseInt(age),
        occupation,
        interests: interests.split(',').map((i) => i.trim()),
        lifeRhythm,
        concerns,
      });
      
      // AIが生成したPivot_Goal候補（モック）
      addGoal({
        title: '英語学習',
        description: '毎日15分英語のポッドキャストを聞く',
        isPrimary: true,
        priority: 1,
      });
      addGoal({
        title: '筋トレ',
        description: '腕立て伏せ10回',
        isPrimary: false,
        priority: 2,
      });
      addGoal({
        title: '散歩',
        description: '5分だけ外に出る',
        isPrimary: false,
        priority: 3,
      });
      
      navigate('/home');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>プロフィール登録</h1>
        <p style={styles.subtitle}>ステップ {step} / 3</p>

        {step === 1 && (
          <div style={styles.form}>
            <label style={styles.label}>ニックネーム</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={styles.input}
              placeholder="例: たろう"
            />

            <label style={styles.label}>年齢</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={styles.input}
              placeholder="例: 25"
            />

            <label style={styles.label}>職業</label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              style={styles.input}
              placeholder="例: エンジニア"
            />
          </div>
        )}

        {step === 2 && (
          <div style={styles.form}>
            <label style={styles.label}>興味分野（カンマ区切り）</label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              style={styles.input}
              placeholder="例: 英語, 筋トレ, 読書"
            />

            <label style={styles.label}>生活リズム</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="morning"
                  checked={lifeRhythm === 'morning'}
                  onChange={(e) => setLifeRhythm(e.target.value as 'morning')}
                />
                朝型
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="night"
                  checked={lifeRhythm === 'night'}
                  onChange={(e) => setLifeRhythm(e.target.value as 'night')}
                />
                夜型
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={styles.form}>
            <label style={styles.label}>現在の悩み</label>
            <textarea
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              style={styles.textarea}
              placeholder="例: 英語の勉強が続かない、運動不足が気になる"
              rows={5}
            />
          </div>
        )}

        <div style={styles.buttonGroup}>
          {step > 1 && (
            <button onClick={handleBack} style={styles.backButton}>
              戻る
            </button>
          )}
          <button
            onClick={handleNext}
            style={styles.nextButton}
            disabled={
              (step === 1 && (!nickname || !age || !occupation)) ||
              (step === 2 && !interests) ||
              (step === 3 && !concerns)
            }
          >
            {step === 3 ? '完了' : '次へ'}
          </button>
        </div>
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
  title: {
    fontSize: '28px',
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    color: '#999',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginBottom: '24px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: '4px',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
  },
  textarea: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  },
  radioGroup: {
    display: 'flex',
    gap: '16px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  backButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  nextButton: {
    flex: 2,
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
