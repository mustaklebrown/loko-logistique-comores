export const OFFLINE_CACHE_KEYS = {
  DELIVERIES: 'loko_deliveries_cache',
  USER_PROFILE: 'loko_user_profile',
  PRODUCTS: 'loko_products_cache',
};

export function saveToOfflineStorage(key: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.error('Error saving to offline storage', e);
  }
}

export function getFromOfflineStorage<T>(
  key: string,
  maxAgeMs: number = 1000 * 60 * 60
): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const payload = JSON.parse(item);
    const age = Date.now() - payload.timestamp;

    if (age > maxAgeMs) {
      return null; // Data is too old
    }

    return payload.data as T;
  } catch (e) {
    console.error('Error reading from offline storage', e);
    return null;
  }
}
