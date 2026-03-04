const MangaCardSkeleton = () => (
    <div className="manga-card-wrapper">
        <div className="manga-card skeleton card-skeleton" />
        <div style={{ marginTop: '12px' }}>
            <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '12px', width: '40%' }} />
        </div>
    </div>
);

export default MangaCardSkeleton;
