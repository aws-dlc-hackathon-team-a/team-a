import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAppStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    // 初回ログイン時はOnboardingへ、それ以外はHomeへ
    navigate('/onboarding');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>だが、それでいい</h1>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>
          ログイン
        </button>
      </form>
      <p style={styles.link}>
        アカウントをお持ちでない方は<a href="/register">新規登録</a>
      </p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: '32px',
    marginBottom: '40px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    maxWidth: '400px',
    gap: '16px',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  link: {
    marginTop: '20px',
    color: '#666',
  },
};
