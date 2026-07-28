import { useState, useEffect } from 'react';
import { getMediaFromVault, getCachedMediaUrl } from './mediaVault';

const blobUrlCache = new Map<string, string>();

/**
 * Converts video/audio Data URLs into Blob URLs (URL.createObjectURL)
 * which HTML5 video/audio elements require to play smoothly in all browsers (Safari, Chrome, Mobile)
 */
export function dataUrlToBlobUrl(dataUrl: string): string {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  if (!dataUrl.startsWith('data:video/') && !dataUrl.startsWith('data:audio/')) {
    return dataUrl;
  }
  if (blobUrlCache.has(dataUrl)) {
    return blobUrlCache.get(dataUrl)!;
  }
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return dataUrl;
    const header = dataUrl.substring(0, commaIdx);
    const base64Str = dataUrl.substring(commaIdx + 1);
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'video/mp4';
    
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    blobUrlCache.set(dataUrl, blobUrl);
    return blobUrl;
  } catch (err) {
    console.warn('Could not convert dataUrl to blobUrl:', err);
    return dataUrl;
  }
}

/**
 * React hook that converts vault tokens (idb_media_...) and media data URLs into browser-friendly URLs
 */
export function useResolvedUrl(rawUrl: string | undefined | null): string {
  const [resolved, setResolved] = useState<string>(() => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('idb_media_')) {
      const cached = getCachedMediaUrl(rawUrl);
      return cached ? dataUrlToBlobUrl(cached) : '';
    }
    return dataUrlToBlobUrl(rawUrl);
  });

  useEffect(() => {
    if (!rawUrl) {
      setResolved('');
      return;
    }

    if (rawUrl.startsWith('idb_media_')) {
      const cached = getCachedMediaUrl(rawUrl);
      if (cached) {
        setResolved(dataUrlToBlobUrl(cached));
      } else {
        let isMounted = true;
        getMediaFromVault(rawUrl).then((url) => {
          if (isMounted && url) {
            setResolved(dataUrlToBlobUrl(url));
          }
        });
        return () => {
          isMounted = false;
        };
      }
    } else {
      setResolved(dataUrlToBlobUrl(rawUrl));
    }
  }, [rawUrl]);

  return resolved;
}
