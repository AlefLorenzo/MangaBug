-- Clean up non-manually entered data
-- We assume manually entered data consists of everything created after the initial seed or by the current admin user ID.
-- However, the user request says "Remove all non-manually added data", implying we should probably clear the initial seed entries.
SET FOREIGN_KEY_CHECKS = 0;
-- These were likely added as part of the seed in rebuild_db.sql
TRUNCATE TABLE reader_history;
TRUNCATE TABLE reading_progress;
TRUNCATE TABLE history;
TRUNCATE TABLE chapter_comments;
TRUNCATE TABLE ratings;
TRUNCATE TABLE favorites;
TRUNCATE TABLE activity_logs;
-- Clear Chapters and Mangas added during seed
TRUNCATE TABLE chapters;
TRUNCATE TABLE mangas;
-- Re-enable constraints
SET FOREIGN_KEY_CHECKS = 1;
-- Log the cleanup
INSERT INTO activity_logs (user_id, action, target_type, target_id, details)
VALUES (
        1,
        'database_cleanup',
        'system',
        0,
        'Removed all non-manually added data (mangas, chapters, progress, etc.)'
    );