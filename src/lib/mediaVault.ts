/**
 * Persistent Media Vault for Bug Board using IndexedDB.
 * Ensures large video files, images, and audio recordings survive page refreshes
 * without exceeding Firestore document limits (~1MB) or using temporary blob URLs.
 */

const DB_NAME = 'BugBoardVaultDB';
const STORE_NAME = 'media_vault';
const DB_VERSION = 1;

// In-memory cache for synchronous instant access during session
const memoryCache = new Map<string, string>();

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Stores a File, Blob, base64 Data URL, or media string in the IndexedDB vault
 * and returns a compact media token `idb_media_<timestamp>_<rand>`
 */
export async function saveMediaToVault(data: Blob | File | string): Promise<string> {
  if (!data) return '';

  if (typeof data === 'string' && !data.startsWith('data:') && !data.startsWith('idb_media_')) {
    return data;
  }

  const mediaId = `idb_media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  if (data instanceof Blob) {
    const objectUrl = URL.createObjectURL(data);
    memoryCache.set(mediaId, objectUrl);
  } else if (typeof data === 'string') {
    memoryCache.set(mediaId, data);
  }

  try {
    const db = await openMediaDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, mediaId);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
    return mediaId;
  } catch (e) {
    console.warn('Failed to store media in IndexedDB vault, keeping in memory:', e);
    return mediaId;
  }
}

/**
 * Retrieves full media URL from vault (IndexedDB or memory cache)
 */
export async function getMediaFromVault(mediaId: string): Promise<string> {
  if (!mediaId || !mediaId.startsWith('idb_media_')) {
    return mediaId;
  }

  if (memoryCache.has(mediaId)) {
    return memoryCache.get(mediaId)!;
  }

  try {
    const db = await openMediaDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(mediaId);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const val = request.result;
        if (val) {
          let url = '';
          if (val instanceof Blob) {
            url = URL.createObjectURL(val);
          } else if (typeof val === 'string') {
            url = val;
          }
          if (url) {
            memoryCache.set(mediaId, url);
          }
          resolve(url);
        } else {
          resolve('');
        }
      };
      request.onerror = () => resolve('');
    });
  } catch (e) {
    console.warn('Failed to load media from IndexedDB vault:', e);
    return '';
  }
}

/**
 * Synchronous cached lookup if already loaded in memory
 */
export function getCachedMediaUrl(mediaId: string): string {
  if (!mediaId || !mediaId.startsWith('idb_media_')) {
    return mediaId;
  }
  return memoryCache.get(mediaId) || '';
}
