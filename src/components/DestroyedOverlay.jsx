import React from 'react';

export const DestroyedOverlay = () => {
    return (
        <div className="defeated-container">
            <div className="defeated-text-wrapper">
                <div className="defeated-title">SHIP DESTROYED</div>
                <div className="defeated-subtitle">Your vessel has been eliminated</div>
            </div>
        </div>
    );
};