import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { MIcon, UnieSalesMark } from '../components/primitives';
import {
  biometryAvailable,
  hasStoredCredentials,
  saveCredentials,
  authenticateAndGetCredentials,
} from '../lib/biometric';
import type { AuthedUser } from '../types';

export function Login() {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioHasCreds, setBioHasCreds] = useState(false);
  const [bioRemember, setBioRemember] = useState(true);
  const autoPrompted = useRef(false);

  const doLogin = async (em: string, pw: string, remember: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const { token, user } = await api.post<{ token: string; user: AuthedUser }>(
        '/auth/login',
        { email: em.trim(), password: pw },
        { anonymous: true },
      );
      if (remember) {
        try {
          await saveCredentials(em.trim(), pw);
        } catch {
          /* storing creds is best-effort — never block sign-in */
        }
      }
      await setSession(token, user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (!email.trim() || !password) return;
    void doLogin(email, password, bioAvailable && bioRemember);
  };

  const fingerprintLogin = async () => {
    setError(null);
    const creds = await authenticateAndGetCredentials();
    if (!creds) return;
    void doLogin(creds.email, creds.password, false);
  };

  // On open: detect biometry + saved credentials, and auto-prompt once so the
  // user can just tap the sensor instead of reaching for the button.
  useEffect(() => {
    void (async () => {
      const avail = await biometryAvailable();
      setBioAvailable(avail);
      if (!avail) return;
      const has = await hasStoredCredentials();
      setBioHasCreds(has);
      if (has && !autoPrompted.current) {
        autoPrompted.current = true;
        void fingerprintLogin();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {bioAvailable && bioHasCreds && (
        <button
          className="m-btn"
          data-variant="primary"
          style={{ width: '100%', marginBottom: 18, height: 48, gap: 8 }}
          disabled={busy}
          onClick={() => void fingerprintLogin()}
        >
          <MIcon name="fingerprint" size={20} /> Sign in with fingerprint
        </button>
      )}

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
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="••••••••"
            style={{ width: '100%', fontSize: 16, paddingRight: 44 }}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              padding: 8,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--m-text-2)',
            }}
          >
            <MIcon name={showPassword ? 'eyeOff' : 'eye'} size={20} />
          </button>
        </div>
      </div>

      {bioAvailable && !bioHasCreds && (
        <div
          onClick={() => setBioRemember((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}
        >
          <MIcon name="fingerprint" size={20} />
          <span style={{ fontSize: 14, flex: 1 }}>Enable fingerprint login</span>
          <span className="m-toggle" data-on={bioRemember} />
        </div>
      )}

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
        data-variant={bioHasCreds ? undefined : 'primary'}
        style={{ width: '100%', marginTop: 12, height: 48 }}
        disabled={busy || !email.trim() || !password}
        onClick={submit}
      >
        {busy ? <span className="m-spin" /> : 'Sign in'}
      </button>
    </div>
  );
}
