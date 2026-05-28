import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { UnieSalesMark } from '../components/primitives';
import type { AuthedUser } from '../types';

export function Login() {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      const { token, user } = await api.post<{ token: string; user: AuthedUser }>(
        '/auth/login',
        { email: email.trim(), password },
        { anonymous: true },
      );
      await setSession(token, user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="m-screen"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', minHeight: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <UnieSalesMark size={46} />
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>UnieSales</div>
          <div style={{ fontSize: 13, color: 'var(--m-text-2)' }}>Your sales, in your pocket</div>
        </div>
      </div>

      <div className="m-field">
        <div className="m-field-label">Email</div>
        <input
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="franco@unielogics.com"
          style={{ width: '100%', fontSize: 16 }}
        />
      </div>
      <div className="m-field">
        <div className="m-field-label">Password</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="••••••••"
          style={{ width: '100%', fontSize: 16 }}
        />
      </div>

      {error && (
        <div
          style={{
            color: 'var(--m-danger)',
            background: 'var(--m-danger-soft)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 13,
            marginTop: 6,
            marginBottom: 6,
          }}
        >
          {error}
        </div>
      )}

      <button
        className="m-btn"
        data-variant="primary"
        style={{ width: '100%', marginTop: 12, height: 48 }}
        disabled={busy || !email.trim() || !password}
        onClick={submit}
      >
        {busy ? <span className="m-spin" /> : 'Sign in'}
      </button>
    </div>
  );
}
