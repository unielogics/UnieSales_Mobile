import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

// Fingerprint / device-biometric login. We use the plugin only to verify the
// user, and keep the credentials ourselves in Preferences (app-private storage)
// so a verified user can be re-logged-in without retyping. No-ops on web.

const CREDS_KEY = 'uniesales:bio-creds';

export interface StoredCredentials {
  email: string;
  password: string;
}

export async function biometryAvailable(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'android') return false;
  try {
    const info = await BiometricAuth.checkBiometry();
    return info.isAvailable;
  } catch {
    return false;
  }
}

export async function hasStoredCredentials(): Promise<boolean> {
  const { value } = await Preferences.get({ key: CREDS_KEY });
  return !!value;
}

export async function saveCredentials(email: string, password: string): Promise<void> {
  await Preferences.set({ key: CREDS_KEY, value: JSON.stringify({ email, password }) });
}

export async function clearCredentials(): Promise<void> {
  await Preferences.remove({ key: CREDS_KEY });
}

/**
 * Prompt for biometrics; on success return the stored credentials. Returns null
 * if the prompt was cancelled/failed or nothing is stored.
 */
export async function authenticateAndGetCredentials(): Promise<StoredCredentials | null> {
  try {
    await BiometricAuth.authenticate({
      reason: 'Sign in to UnieSales',
      androidTitle: 'Fingerprint login',
      androidSubtitle: 'Use your fingerprint to sign in',
      allowDeviceCredential: true,
    });
  } catch {
    return null; // cancelled, no match, or lockout
  }
  const { value } = await Preferences.get({ key: CREDS_KEY });
  if (!value) return null;
  try {
    return JSON.parse(value) as StoredCredentials;
  } catch {
    return null;
  }
}
