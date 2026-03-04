import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const API_BASE = `${API_BASE_URL}/api/reader`;

export const useReader = (userId, mangaId, initialChapterId) => {
    const [chapterId, setChapterId] = useState(initialChapterId);
    const [page, setPage] = useState(1);
    const [isInterfaceVisible, setInterfaceVisible] = useState(true);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    const timeRef = useRef(Date.now());

    const [overallProgress, setOverallProgress] = useState({ total_chapters: 0, read_chapters: 0, overall_percentage: 0 });

    // Load initial state from backend
    useEffect(() => {
        const fetchState = async () => {
            if (!userId || !mangaId) {
                setLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${API_BASE}/progress/${userId}/${mangaId}`);
                if (res.data) {
                    // Only resume page if it's the SAME chapter being loaded
                    if (res.data.chapter_id === (initialChapterId || chapterId)) {
                        setPage(res.data.page_number || 1);
                        setProgress(res.data.progress_percentage || 0);
                    }

                    // Only auto-switch chapter if no initialChapterId was provided (Resume Case)
                    if (!initialChapterId && res.data.chapter_id) {
                        setChapterId(res.data.chapter_id);
                    }

                    setOverallProgress({
                        total_chapters: res.data.total_chapters,
                        read_chapters: res.data.read_chapters,
                        overall_percentage: res.data.overall_percentage
                    });
                }
            } catch (err) {
                console.error("Failed to load reader state", err);
            } finally {
                setLoading(false);
            }
        };
        fetchState();
    }, [userId, mangaId]);

    // Sync progress to backend
    const syncProgress = useCallback(async (isCompleted = false) => {
        if (!userId || !mangaId || !chapterId) return;
        const timeSpent = Math.floor((Date.now() - timeRef.current) / 1000);
        timeRef.current = Date.now();

        try {
            const res = await axios.post(`${API_BASE}/update`, {
                userId,
                mangaId,
                chapterId,
                pageNumber: page,
                progressPercentage: progress,
                timeSpent
            });

            if (isCompleted) {
                await axios.post(`${API_BASE}/complete`, { userId, mangaId, chapterId });
            }

            // Refresh overall stats after sync/completion
            if (res.data.success) {
                const stats = await axios.get(`${API_BASE}/progress/${userId}/${mangaId}`);
                setOverallProgress({
                    total_chapters: stats.data.total_chapters,
                    read_chapters: stats.data.read_chapters,
                    overall_percentage: stats.data.overall_percentage
                });
            }
        } catch (err) {
            console.error("Sync failed", err);
        }
    }, [userId, mangaId, chapterId, page, progress]);

    // Auto-sync on page change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!loading) syncProgress();
        }, 3000); // Sync after 3s of inactivity on a page
        return () => clearTimeout(timer);
    }, [page, syncProgress, loading]);

    const changePage = (newPage, totalPages) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
        const newProgress = Math.round((newPage / totalPages) * 100);
        setProgress(newProgress);

        if (newPage === totalPages) {
            syncProgress(true); // Complete chapter on last page
        }
    };

    const toggleInterface = () => setInterfaceVisible(!isInterfaceVisible);

    return {
        chapterId,
        page,
        progress,
        isInterfaceVisible,
        loading,
        setChapterId,
        changePage,
        toggleInterface,
        syncProgress
    };
};
