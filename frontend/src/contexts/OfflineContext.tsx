import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { syncManager, getPendingRequests } from '../services/offlineDb';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineContextType {
  isOnline: boolean;
  pendingCount: number;
  syncNow: () => Promise<void>;
  isSyncing: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Listen to online/offline changes
    const unsubscribe = syncManager.addListener((online) => {
      setIsOnline(online);
      setShowBanner(!online);
      
      // Auto-hide banner after coming back online
      if (online) {
        setTimeout(() => setShowBanner(false), 3000);
      }
    });

    // Update pending count periodically
    const updatePendingCount = async () => {
      const pending = await getPendingRequests();
      setPendingCount(pending.length);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const syncNow = async () => {
    if (isSyncing || !isOnline) return;
    
    setIsSyncing(true);
    try {
      await syncManager.syncPendingRequests();
      const pending = await getPendingRequests();
      setPendingCount(pending.length);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider value={{ isOnline, pendingCount, syncNow, isSyncing }}>
      {children}
      
      {/* Offline banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50"
          >
            <div className={`px-4 py-3 flex items-center justify-center gap-3 ${
              isOnline 
                ? 'bg-green-500 text-white' 
                : 'bg-yellow-500 text-yellow-900'
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5" />
                  <span className="font-medium">{t('offline.synced')}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5" />
                  <span className="font-medium">{t('offline.title')}</span>
                  <span className="text-sm opacity-90">{t('offline.message')}</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

// Offline status indicator component
export function OfflineIndicator() {
  const { isOnline, pendingCount, syncNow, isSyncing } = useOffline();
  const { t } = useTranslation();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {!isOnline && (
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
          <WifiOff className="w-3 h-3" />
          <span>{t('offline.title')}</span>
        </div>
      )}
      
      {pendingCount > 0 && (
        <button
          onClick={syncNow}
          disabled={!isOnline || isSyncing}
          className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>
            {isSyncing ? t('offline.syncing') : `${pendingCount} ${t('common.pending')}`}
          </span>
        </button>
      )}
    </div>
  );
}

export default OfflineContext;
