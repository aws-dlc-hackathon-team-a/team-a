import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const HomeScreen: React.FC = () => {
  const { user, actionTickets, totalEffortPoints, markTicketDone, logout } = useAppStore();
  const navigate = useNavigate();

  const openTickets = actionTickets.filter((t) => t.status === 'open');
  const doneTickets = actionTickets.filter((t) => t.status === 'done');

  const handleTrigger = () => {
    navigate('/recommendation');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>ホーム</h1>
        <div style={styles.userInfo}>
          <button onClick={() => navigate('/profile')} style={styles.navButton}>
            プロフィール
          </button>
          <button onClick={() => navigate('/stats')} style={styles.navButton}>
            統計
          </button>
          <span>{user?.nickname || user?.email}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            ログアウト
          </button>
        </div>
      </header>

      <div style={styles.content}>
        <div style={styles.pointsSummary}>
          <span style={styles.pointsLabel}>累計Effort Point</span>
          <span style={styles.pointsValue}>{totalEffortPoints} pt</span>
        </div>

        <button onClick={handleTrigger} style={styles.triggerButton}>
          今日の行動を決める
        </button>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            今日のチケット ({openTickets.length}件)
          </h2>
          {openTickets.length === 0 ? (
            <p style={styles.emptyText}>まだチケットがありません</p>
          ) : (
            <div style={styles.ticketList}>
              {openTickets.map((ticket) => (
                <div key={ticket.id} style={styles.ticketCard}>
                  <div style={styles.ticketHeader}>
                    <span style={styles.ticketBadge}>
                      {ticket.goalType === 'primary' ? 'メイン' : 'ピボット'}
                    </span>
                    <span style={styles.ticketLevel}>
                      {ticket.actionLevel === 'normal' ? '通常' : '最小限'}
                    </span>
                  </div>
                  <p style={styles.ticketAction}>{ticket.action}</p>
                  <button
                    onClick={() => markTicketDone(ticket.id)}
                    style={styles.doneButton}
                  >
                    完了にする
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {doneTickets.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              完了したチケット ({doneTickets.length}件)
            </h2>
            <div style={styles.ticketList}>
              {doneTickets.map((ticket) => (
                <div key={ticket.id} style={styles.ticketCardDone}>
                  <div style={styles.ticketHeader}>
                    <span style={styles.ticketBadge}>
                      {ticket.goalType === 'primary' ? 'メイン' : 'ピボット'}
                    </span>
                  </div>
                  <p style={styles.ticketAction}>{ticket.action}</p>
                  <span style={styles.doneLabel}>✓ 完了</span>
                </div>
              ))}
            </div>
          </section>
        )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    margin: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  content: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  pointsSummary: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: '16px',
    color: '#666',
  },
  pointsValue: {
    fontSize: '28px',
    fontWeight: 'bold' as const,
    color: '#007AFF',
  },
  triggerButton: {
    width: '100%',
    padding: '20px',
    fontSize: '18px',
    fontWeight: 'bold' as const,
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '32px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '16px',
    color: '#333',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  ticketList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  ticketCard: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #ddd',
  },
  ticketCardDone: {
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #ddd',
    opacity: 0.7,
  },
  ticketHeader: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  ticketBadge: {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#007AFF',
    color: 'white',
    borderRadius: '4px',
  },
  ticketLevel: {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    borderRadius: '4px',
  },
  ticketAction: {
    fontSize: '16px',
    margin: '8px 0',
    color: '#333',
  },
  doneButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#34C759',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  doneLabel: {
    color: '#34C759',
    fontWeight: 'bold' as const,
  },
};
