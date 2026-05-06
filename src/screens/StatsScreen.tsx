import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const StatsScreen: React.FC = () => {
  const { totalEffortPoints, effortPoints, actionTickets } = useAppStore();
  const navigate = useNavigate();

  const doneTickets = actionTickets.filter((t) => t.status === 'done');
  const primaryDone = doneTickets.filter((t) => t.goalType === 'primary').length;
  const pivotDone = doneTickets.filter((t) => t.goalType === 'pivot').length;

  // 週間データ（直近7日）
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const weeklyData = last7Days.map((date) => {
    const record = effortPoints.find((r) => r.date === date);
    return {
      date: new Date(date).toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
      }),
      points: record?.points || 0,
    };
  });

  const maxPoints = Math.max(...weeklyData.map((d) => d.points), 1);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate('/home')} style={styles.backButton}>
          ← ホームに戻る
        </button>
        <h1 style={styles.title}>統計</h1>
      </header>

      <div style={styles.content}>
        {/* 累計ポイント */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>累計Effort Point</h2>
          <div style={styles.totalPoints}>
            <span style={styles.pointsNumber}>{totalEffortPoints}</span>
            <span style={styles.pointsLabel}>pt</span>
          </div>
          {totalEffortPoints >= 100 && (
            <div style={styles.milestone}>
              🎉 {Math.floor(totalEffortPoints / 100) * 100}pt達成！
            </div>
          )}
        </section>

        {/* 週間グラフ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>週間Effort Point</h2>
          <div style={styles.chart}>
            {weeklyData.map((data, index) => (
              <div key={index} style={styles.chartBar}>
                <div
                  style={{
                    ...styles.bar,
                    height: `${(data.points / maxPoints) * 150}px`,
                  }}
                >
                  <span style={styles.barLabel}>{data.points}</span>
                </div>
                <span style={styles.barDate}>{data.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 行動サマリー */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>行動サマリー</h2>
          <div style={styles.summary}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>完了したチケット</span>
              <span style={styles.summaryValue}>{doneTickets.length}件</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Primary Goal達成</span>
              <span style={styles.summaryValue}>{primaryDone}件</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Pivot Goal達成</span>
              <span style={styles.summaryValue}>{pivotDone}件</span>
            </div>
          </div>
        </section>

        {/* 得意な行動パターン */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>得意な行動パターン</h2>
          {doneTickets.length === 0 ? (
            <p style={styles.emptyText}>まだデータがありません</p>
          ) : (
            <div style={styles.patterns}>
              <p style={styles.patternText}>
                {pivotDone > primaryDone
                  ? '柔軟に目標を切り替えて行動できています'
                  : 'Primary Goalに集中して取り組めています'}
              </p>
              <p style={styles.patternText}>
                完了率: {Math.round((doneTickets.length / actionTickets.length) * 100)}%
              </p>
            </div>
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
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '16px',
    color: '#333',
  },
  totalPoints: {
    textAlign: 'center' as const,
    padding: '32px',
  },
  pointsNumber: {
    fontSize: '64px',
    fontWeight: 'bold' as const,
    color: '#007AFF',
  },
  pointsLabel: {
    fontSize: '24px',
    color: '#666',
    marginLeft: '8px',
  },
  milestone: {
    textAlign: 'center' as const,
    fontSize: '18px',
    color: '#34C759',
    marginTop: '16px',
  },
  chart: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '200px',
    padding: '20px 0',
  },
  chartBar: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  bar: {
    width: '40px',
    backgroundColor: '#007AFF',
    borderRadius: '4px 4px 0 0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '4px',
    minHeight: '20px',
  },
  barLabel: {
    fontSize: '12px',
    color: 'white',
    fontWeight: 'bold' as const,
  },
  barDate: {
    fontSize: '12px',
    color: '#666',
  },
  summary: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  summaryLabel: {
    fontSize: '16px',
    color: '#333',
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#007AFF',
  },
  patterns: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  patternText: {
    fontSize: '16px',
    color: '#333',
    padding: '12px',
    backgroundColor: '#f0f8ff',
    borderRadius: '8px',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center' as const,
    padding: '20px',
  },
};
