import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema
interface SigahDB extends DBSchema {
  pendingRequests: {
    key: string;
    value: {
      id: string;
      url: string;
      method: string;
      body: unknown;
      timestamp: number;
      retries: number;
    };
    indexes: { 'by-timestamp': number };
  };
  cachedData: {
    key: string;
    value: {
      key: string;
      data: unknown;
      timestamp: number;
      expiresAt: number;
    };
    indexes: { 'by-expires': number };
  };
  userPreferences: {
    key: string;
    value: {
      key: string;
      value: unknown;
    };
  };
  dashboardWidgets: {
    key: string;
    value: {
      id: string;
      userId: string;
      type: string;
      position: { x: number; y: number };
      size: { w: number; h: number };
      config: Record<string, unknown>;
      visible: boolean;
    };
    indexes: { 'by-user': string };
  };
}

const DB_NAME = 'sigah-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<SigahDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<SigahDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SigahDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Pending requests store
      if (!db.objectStoreNames.contains('pendingRequests')) {
        const pendingStore = db.createObjectStore('pendingRequests', { keyPath: 'id' });
        pendingStore.createIndex('by-timestamp', 'timestamp');
      }

      // Cached data store
      if (!db.objectStoreNames.contains('cachedData')) {
        const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
        cacheStore.createIndex('by-expires', 'expiresAt');
      }

      // User preferences store
      if (!db.objectStoreNames.contains('userPreferences')) {
        db.createObjectStore('userPreferences', { keyPath: 'key' });
      }

      // Dashboard widgets store
      if (!db.objectStoreNames.contains('dashboardWidgets')) {
        const widgetsStore = db.createObjectStore('dashboardWidgets', { keyPath: 'id' });
        widgetsStore.createIndex('by-user', 'userId');
      }
    },
  });

  return dbInstance;
}

// Pending Requests (for offline sync)
export async function addPendingRequest(request: {
  url: string;
  method: string;
  body?: unknown;
}): Promise<string> {
  const db = await getDB();
  const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.add('pendingRequests', {
    id,
    url: request.url,
    method: request.method,
    body: request.body,
    timestamp: Date.now(),
    retries: 0,
  });

  return id;
}

export async function getPendingRequests() {
  const db = await getDB();
  return db.getAllFromIndex('pendingRequests', 'by-timestamp');
}

export async function removePendingRequest(id: string) {
  const db = await getDB();
  await db.delete('pendingRequests', id);
}

export async function updatePendingRequestRetries(id: string, retries: number) {
  const db = await getDB();
  const request = await db.get('pendingRequests', id);
  if (request) {
    request.retries = retries;
    await db.put('pendingRequests', request);
  }
}

// Cache management
export async function cacheData(key: string, data: unknown, ttlMs: number = 3600000) {
  const db = await getDB();
  await db.put('cachedData', {
    key,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const cached = await db.get('cachedData', key);
  
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    await db.delete('cachedData', key);
    return null;
  }
  
  return cached.data as T;
}

export async function clearExpiredCache() {
  const db = await getDB();
  const tx = db.transaction('cachedData', 'readwrite');
  const index = tx.store.index('by-expires');
  
  let cursor = await index.openCursor(IDBKeyRange.upperBound(Date.now()));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
}

// User preferences
export async function setPreference(key: string, value: unknown) {
  const db = await getDB();
  await db.put('userPreferences', { key, value });
}

export async function getPreference<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const pref = await db.get('userPreferences', key);
  return pref ? (pref.value as T) : null;
}

// Dashboard widgets
export interface DashboardWidget {
  id: string;
  userId: string;
  type: 'stats' | 'chart' | 'table' | 'alerts' | 'activity' | 'quick-actions';
  position: { x: number; y: number };
  size: { w: number; h: number };
  config: Record<string, unknown>;
  visible: boolean;
}

export async function saveDashboardWidget(widget: DashboardWidget) {
  const db = await getDB();
  await db.put('dashboardWidgets', widget);
}

export async function getDashboardWidgets(userId: string): Promise<DashboardWidget[]> {
  const db = await getDB();
  return db.getAllFromIndex('dashboardWidgets', 'by-user', userId);
}

export async function deleteDashboardWidget(id: string) {
  const db = await getDB();
  await db.delete('dashboardWidgets', id);
}

export async function getDefaultDashboardWidgets(userId: string): Promise<DashboardWidget[]> {
  return [
    {
      id: `${userId}_stats`,
      userId,
      type: 'stats',
      position: { x: 0, y: 0 },
      size: { w: 4, h: 1 },
      config: {},
      visible: true,
    },
    {
      id: `${userId}_chart`,
      userId,
      type: 'chart',
      position: { x: 0, y: 1 },
      size: { w: 2, h: 2 },
      config: { chartType: 'line' },
      visible: true,
    },
    {
      id: `${userId}_alerts`,
      userId,
      type: 'alerts',
      position: { x: 2, y: 1 },
      size: { w: 2, h: 1 },
      config: {},
      visible: true,
    },
    {
      id: `${userId}_activity`,
      userId,
      type: 'activity',
      position: { x: 2, y: 2 },
      size: { w: 2, h: 1 },
      config: { limit: 5 },
      visible: true,
    },
    {
      id: `${userId}_quickactions`,
      userId,
      type: 'quick-actions',
      position: { x: 0, y: 3 },
      size: { w: 4, h: 1 },
      config: {},
      visible: true,
    },
  ];
}

// Sync manager
export class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.handleOnlineChange(true));
    window.addEventListener('offline', () => this.handleOnlineChange(false));
  }

  private handleOnlineChange(online: boolean) {
    this.isOnline = online;
    this.listeners.forEach(listener => listener(online));
    
    if (online && !this.syncInProgress) {
      this.syncPendingRequests();
    }
  }

  addListener(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getOnlineStatus() {
    return this.isOnline;
  }

  async syncPendingRequests() {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    
    try {
      const pending = await getPendingRequests();
      
      for (const request of pending) {
        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: { 'Content-Type': 'application/json' },
            body: request.body ? JSON.stringify(request.body) : undefined,
          });

          if (response.ok) {
            await removePendingRequest(request.id);
          } else if (request.retries >= 3) {
            // Max retries reached, remove the request
            await removePendingRequest(request.id);
            console.error(`Failed to sync request ${request.id} after 3 retries`);
          } else {
            await updatePendingRequestRetries(request.id, request.retries + 1);
          }
        } catch (error) {
          console.error(`Error syncing request ${request.id}:`, error);
          await updatePendingRequestRetries(request.id, request.retries + 1);
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }
}

export const syncManager = new SyncManager();

// Clear all offline data
export async function clearAllOfflineData() {
  const db = await getDB();
  await db.clear('pendingRequests');
  await db.clear('cachedData');
}
