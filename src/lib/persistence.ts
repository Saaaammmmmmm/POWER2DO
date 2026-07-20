import type { AppSettings, Category, CustomFilter, GmailEmail, Space, StreakData, Task } from '../types';

const PERSISTENCE_API = '/.netlify/functions/persistence';

export interface PersistedUserState {
  tasks: Task[];
  categories: Category[];
  spaces: Space[];
  settings: AppSettings;
  filters: CustomFilter[];
  gmail: GmailEmail[];
  streak: StreakData;
  updatedAt: number;
}

function isPersistedUserState(value: unknown): value is PersistedUserState {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<PersistedUserState>;
  return (
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.spaces) &&
    Array.isArray(candidate.filters) &&
    Array.isArray(candidate.gmail) &&
    typeof candidate.settings === 'object' &&
    typeof candidate.streak === 'object'
  );
}

export function resolvePersistedUserState(
  remoteState: Partial<PersistedUserState> | null | undefined,
  localState: Partial<PersistedUserState> | null | undefined,
  fallback: PersistedUserState,
): PersistedUserState {
  const candidates: Array<Partial<PersistedUserState>> = [];

  if (isPersistedUserState(remoteState)) {
    candidates.push(remoteState);
  }

  if (isPersistedUserState(localState)) {
    candidates.push(localState);
  }

  candidates.push(fallback);

  const latest = candidates.reduce<Partial<PersistedUserState> | null>((best, candidate) => {
    if (!best) return candidate;
    if (!candidate) return best;

    const bestUpdatedAt = best.updatedAt ?? 0;
    const candidateUpdatedAt = candidate.updatedAt ?? 0;

    if (candidateUpdatedAt > bestUpdatedAt) {
      return candidate;
    }

    return best;
  }, null);

  const chosen = latest ?? fallback;

  return {
    ...fallback,
    ...chosen,
    updatedAt: chosen.updatedAt ?? 0,
  } as PersistedUserState;
}

function readLocalValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return fallback;
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeLocalValue(key: string, value: unknown) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem(`${key}__updated_at`, String(Date.now()));
  } catch {
    // Ignore storage write failures so the app remains usable.
  }
}

function removeLocalValue(key: string) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(`${key}__updated_at`);
  } catch {
    // Ignore storage removal failures.
  }
}

export function createUserStorageKey(userEmail: string, suffix: string) {
  const normalized = userEmail
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return `power_todo_${normalized || 'user'}_${suffix}`;
}

export function createUserSnapshotKey(userEmail: string) {
  return createUserStorageKey(userEmail, 'snapshot');
}

export async function loadPersistedUserState(userEmail: string, fallback: PersistedUserState): Promise<PersistedUserState> {
  if (typeof window === 'undefined') return fallback;

  const key = createUserSnapshotKey(userEmail);

  try {
    const response = await fetch(`${PERSISTENCE_API}?key=${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error('Persistence request failed');

    const payload = await response.json();
    if (payload?.value && typeof payload.value === 'object') {
      const remoteState = payload.value as PersistedUserState;
      const localState = readLocalValue<PersistedUserState>(key, fallback);
      return resolvePersistedUserState(remoteState, localState, fallback);
    }
  } catch {
    // Fall back to local browser storage.
  }

  return readLocalValue(key, fallback);
}

export async function savePersistedUserState(userEmail: string, state: PersistedUserState): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = createUserSnapshotKey(userEmail);
  const previousState = readLocalValue<PersistedUserState>(key, state);
  const payload = {
    ...state,
    updatedAt: Math.max(previousState.updatedAt ?? 0, Date.now()),
  };

  try {
    const response = await fetch(PERSISTENCE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: payload }),
    });

    if (!response.ok) throw new Error('Persistence request failed');
  } catch {
    // Ignore and keep the local fallback copy.
  }

  writeLocalValue(key, payload);
  notifyPersistenceSync(userEmail);
}

export async function clearPersistedUserState(userEmail: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = createUserSnapshotKey(userEmail);

  try {
    const response = await fetch(PERSISTENCE_API, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) throw new Error('Persistence request failed');
  } catch {
    // Ignore and continue to local fallback cleanup.
  }

  removeLocalValue(key);
  notifyPersistenceSync(userEmail);
}

export function subscribeToPersistenceSync(userEmail: string, callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const onStorage = (event: StorageEvent) => {
    if (!event.key) return;
    if (event.key.includes('__updated_at')) return;
    if (!event.key.includes(createUserSnapshotKey(userEmail))) return;
    callback();
  };

  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('power2do-sync') : null;
  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === 'sync' && event.data.userEmail === userEmail) {
      callback();
    }
  };

  const onCustomSync = () => callback();

  const pollId = window.setInterval(callback, 1500);

  window.addEventListener('storage', onStorage);
  window.addEventListener('power2do-sync', onCustomSync);
  channel?.addEventListener('message', onMessage);

  return () => {
    window.clearInterval(pollId);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('power2do-sync', onCustomSync);
    channel?.removeEventListener('message', onMessage);
    channel?.close();
  };
}

function notifyPersistenceSync(userEmail: string) {
  if (typeof window === 'undefined') return;

  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('power2do-sync') : null;
  channel?.postMessage({ type: 'sync', userEmail });
  window.dispatchEvent(new CustomEvent('power2do-sync', { detail: { userEmail } }));
  channel?.close();
}
