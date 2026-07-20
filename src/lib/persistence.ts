const PERSISTENCE_API = '/.netlify/functions/persistence';

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
  } catch {
    // Ignore storage write failures so the app remains usable.
  }
}

function removeLocalValue(key: string) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
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

export async function loadPersistedValue<T>(key: string, fallback: T): Promise<T> {
  if (typeof window === 'undefined') return fallback;

  try {
    const response = await fetch(`${PERSISTENCE_API}?key=${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error('Persistence request failed');

    const payload = await response.json();
    if (payload?.value === undefined) return fallback;
    return payload.value as T;
  } catch {
    return readLocalValue(key, fallback);
  }
}

export async function savePersistedValue<T>(key: string, value: T): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const response = await fetch(PERSISTENCE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });

    if (!response.ok) throw new Error('Persistence request failed');
  } catch {
    writeLocalValue(key, value);
  }
}

export async function clearPersistedValue(key: string): Promise<void> {
  if (typeof window === 'undefined') return;

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
}
