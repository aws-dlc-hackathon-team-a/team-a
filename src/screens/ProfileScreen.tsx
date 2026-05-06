import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const ProfileScreen: React.FC = () => {
  const { profile, goals, updateProfile, addGoal, deleteGoal, setPrimaryGoal } =
    useAppStore();
  const navigate = useNavigate();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');

  const handleSaveProfile = () => {
    if (editedProfile) {
      updateProfile(editedProfile);
      setIsEditingProfile(false);
    }
  };

  const handleAddGoal = () => {
    if (newGoalTitle && newGoalDescription) {
      addGoal({
        title: newGoalTitle,
        description: newGoalDescription,
        isPrimary: goals.length === 0,
        priority: goals.length + 1,
      });
      setNewGoalTitle('');
      setNewGoalDescription('');
      setIsAddingGoal(false);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('このGoalを削除しますか？')) {
      deleteGoal(goalId);
    }
  };

  const primaryGoal = goals.find((g) => g.isPrimary);
  const pivotGoals = goals.filter((g) => !g.isPrimary);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate('/home')} style={styles.backButton}>
          ← ホームに戻る
        </button>
        <h1 style={styles.title}>プロフィール</h1>
      </header>

      <div style={styles.content}>
        {/* プロフィールセクション */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>基本情報</h2>
            {!isEditingProfile && (
              <button
                onClick={() => {
                  setEditedProfile(profile);
                  setIsEditingProfile(true);
                }}
                style={styles.editButton}
              >
                編集
              </button>
            )}
          </div>

          {!profile ? (
            <p style={styles.emptyText}>プロフィールが登録されていません</p>
          ) : isEditingProfile && editedProfile ? (
            <div style={styles.form}>
              <label style={styles.label}>ニックネーム</label>
              <input
                type="text"
                value={editedProfile.nickname}
                onChange={(e) =>
                  setEditedProfile({ ...editedProfile, nickname: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>年齢</label>
              <input
                type="number"
                value={editedProfile.age}
                onChange={(e) =>
                  setEditedProfile({ ...editedProfile, age: parseInt(e.target.value) })
                }
                style={styles.input}
              />

              <label style={styles.label}>職業</label>
              <input
                type="text"
                value={editedProfile.occupation}
                onChange={(e) =>
                  setEditedProfile({ ...editedProfile, occupation: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>興味分野</label>
              <input
                type="text"
                value={editedProfile.interests.join(', ')}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    interests: e.target.value.split(',').map((i) => i.trim()),
                  })
                }
                style={styles.input}
              />

              <label style={styles.label}>現在の悩み</label>
              <textarea
                value={editedProfile.concerns}
                onChange={(e) =>
                  setEditedProfile({ ...editedProfile, concerns: e.target.value })
                }
                style={styles.textarea}
                rows={3}
              />

              <div style={styles.buttonGroup}>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  style={styles.cancelButton}
                >
                  キャンセル
                </button>
                <button onClick={handleSaveProfile} style={styles.saveButton}>
                  保存
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.profileInfo}>
              <p>
                <strong>ニックネーム:</strong> {profile.nickname}
              </p>
              <p>
                <strong>年齢:</strong> {profile.age}歳
              </p>
              <p>
                <strong>職業:</strong> {profile.occupation}
              </p>
              <p>
                <strong>興味分野:</strong> {profile.interests.join(', ')}
              </p>
              <p>
                <strong>生活リズム:</strong>{' '}
                {profile.lifeRhythm === 'morning' ? '朝型' : '夜型'}
              </p>
              <p>
                <strong>現在の悩み:</strong> {profile.concerns}
              </p>
            </div>
          )}
        </section>

        {/* Goalセクション */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Goal管理</h2>
            <button
              onClick={() => setIsAddingGoal(true)}
              style={styles.addButton}
            >
              + 追加
            </button>
          </div>

          {isAddingGoal && (
            <div style={styles.form}>
              <label style={styles.label}>Goal名</label>
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                style={styles.input}
                placeholder="例: 英語学習"
              />

              <label style={styles.label}>説明</label>
              <textarea
                value={newGoalDescription}
                onChange={(e) => setNewGoalDescription(e.target.value)}
                style={styles.textarea}
                placeholder="例: 毎日15分英語のポッドキャストを聞く"
                rows={3}
              />

              <div style={styles.buttonGroup}>
                <button
                  onClick={() => {
                    setIsAddingGoal(false);
                    setNewGoalTitle('');
                    setNewGoalDescription('');
                  }}
                  style={styles.cancelButton}
                >
                  キャンセル
                </button>
                <button onClick={handleAddGoal} style={styles.saveButton}>
                  追加
                </button>
              </div>
            </div>
          )}

          {primaryGoal && (
            <div style={styles.goalCard}>
              <div style={styles.goalHeader}>
                <span style={styles.primaryBadge}>Primary Goal</span>
              </div>
              <h3 style={styles.goalTitle}>{primaryGoal.title}</h3>
              <p style={styles.goalDescription}>{primaryGoal.description}</p>
              <button
                onClick={() => handleDeleteGoal(primaryGoal.id)}
                style={styles.deleteButton}
              >
                削除
              </button>
            </div>
          )}

          {pivotGoals.length > 0 && (
            <>
              <h3 style={styles.subsectionTitle}>Pivot Goals</h3>
              {pivotGoals.map((goal) => (
                <div key={goal.id} style={styles.goalCard}>
                  <div style={styles.goalHeader}>
                    <span style={styles.pivotBadge}>Pivot Goal</span>
                    <span style={styles.priority}>優先度: {goal.priority}</span>
                  </div>
                  <h3 style={styles.goalTitle}>{goal.title}</h3>
                  <p style={styles.goalDescription}>{goal.description}</p>
                  <div style={styles.goalActions}>
                    <button
                      onClick={() => setPrimaryGoal(goal.id)}
                      style={styles.setPrimaryButton}
                    >
                      Primary Goalにする
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      style={styles.deleteButton}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {goals.length === 0 && (
            <p style={styles.emptyText}>まだGoalが登録されていません</p>
          )}
        </section>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '16px 20px',
    borderBottom: '1px solid #ddd',
  },
  backButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  title: {
    fontSize: '24px',
    margin: 0,
  },
  content: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '20px',
    margin: 0,
  },
  subsectionTitle: {
    fontSize: '18px',
    marginTop: '24px',
    marginBottom: '12px',
    color: '#666',
  },
  editButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  addButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#34C759',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center' as const,
    padding: '20px',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#333',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
  },
  textarea: {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  saveButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  goalCard: {
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  goalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  primaryBadge: {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#007AFF',
    color: 'white',
    borderRadius: '4px',
    fontWeight: 'bold' as const,
  },
  pivotBadge: {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#FF9500',
    color: 'white',
    borderRadius: '4px',
  },
  priority: {
    fontSize: '12px',
    color: '#666',
  },
  goalTitle: {
    fontSize: '18px',
    margin: '8px 0',
  },
  goalDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
  },
  goalActions: {
    display: 'flex',
    gap: '8px',
  },
  setPrimaryButton: {
    padding: '8px 12px',
    fontSize: '12px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '8px 12px',
    fontSize: '12px',
    backgroundColor: '#FF3B30',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
