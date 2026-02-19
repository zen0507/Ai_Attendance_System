import React from 'react';

const PageLoader = () => {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-base-200">
            <span className="loading loading-infinity loading-lg text-primary scale-150"></span>
            <p className="mt-4 text-base-content/60 animate-pulse">Loading System...</p>
        </div>
    );
};

export default PageLoader;
