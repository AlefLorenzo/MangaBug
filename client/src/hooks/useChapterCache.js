import { useState, useCallback } from 'react';

const CACHE_PREFIX = 'chapter_images_';
const MAX_CACHE_ITEMS = 10; // Max chapters to store
const MAX_LOCALSTORAGE_SIZE = 4.5 * 1024 * 1024; // ~4.5MB safe limit

export const useChapterCache = () => {
    const [isCaching, setIsCaching] = useState(false);

    const getCachedChapter = useCallback((chapterId) => {
        try {
            const cached = localStorage.getItem(`${CACHE_PREFIX}${chapterId}`);
            if (cached) {
                const { pages, timestamp } = JSON.parse(cached);
                // Update timestamp for LRU cleanup
                saveToCache(chapterId, pages);
                return pages;
            }
        } catch (e) {
            console.warn("Cache read failed", e);
        }
        return null;
    }, []);

    const saveToCache = useCallback((chapterId, pages) => {
        try {
            const cacheData = JSON.stringify({ pages, timestamp: Date.now() });

            // Basic size check before saving (string length is roughly bytes in UTF-16)
            if (cacheData.length > MAX_LOCALSTORAGE_SIZE) {
                console.warn("Chapter too large for localStorage cache");
                return;
            }

            // Cleanup old items if needed
            cleanupCache();

            localStorage.setItem(`${CACHE_PREFIX}${chapterId}`, cacheData);
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                forceCleanup();
                // Try once more after aggressive cleanup
                try {
                    localStorage.setItem(`${CACHE_PREFIX}${chapterId}`, JSON.stringify({ pages, timestamp: Date.now() }));
                } catch (retryErr) {
                    console.error("Cache still full after cleanup", retryErr);
                }
            }
        }
    }, []);

    const cleanupCache = () => {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
        if (keys.length >= MAX_CACHE_ITEMS) {
            const items = keys.map(k => ({
                key: k,
                timestamp: JSON.parse(localStorage.getItem(k)).timestamp
            })).sort((a, b) => a.timestamp - b.timestamp);

            // Remove oldest item
            localStorage.removeItem(items[0].key);
        }
    };

    const forceCleanup = () => {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
        keys.forEach(k => localStorage.removeItem(k));
    };

    return { getCachedChapter, saveToCache, isCaching };
};
