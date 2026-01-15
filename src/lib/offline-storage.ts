export interface PendingAction {
  id: string;
  type: 'CREATE_DELIVERY' | 'ADD_PRODUCT';
  data: any;
  timestamp: number;
}

const QUEUE_KEY = 'loko_offline_queue';

// Keys for simpler data caching
export const OFFLINE_CACHE_KEYS = {
  DELIVERIES: 'loko_deliveries',
  PRODUCTS: 'loko_products',
  USER: 'loko_user',
  USER_PROFILE: 'loko_user_profile',
  STATS: 'loko_stats',
};

export function saveToOfflineStorage(key: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to offline storage', e);
  }
}

export function getFromOfflineStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export const offlineStorage = {
  save: (type: PendingAction['type'], data: any) => {
    if (typeof window === 'undefined') return;

    const queue = offlineStorage.getAll();
    const newAction: PendingAction = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
    };

    queue.push(newAction);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return newAction;
  },

  getAll: (): PendingAction[] => {
    if (typeof window === 'undefined') return [];
    try {
      const item = localStorage.getItem(QUEUE_KEY);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  },

  remove: (id: string) => {
    if (typeof window === 'undefined') return;
    const queue = offlineStorage.getAll();
    const filtered = queue.filter((item) => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(QUEUE_KEY);
  },
};
