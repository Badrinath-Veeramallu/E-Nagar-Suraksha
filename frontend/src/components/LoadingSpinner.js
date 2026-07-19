import React from 'react';

const LoadingSpinner = ({ fullScreen = false, size = 'md' }) => {
    const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
    const spinner = (
        <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-primary-600 ${sizes[size]}`} />
    );
    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full border-4 border-gray-200 border-t-primary-600 h-12 w-12" />
                    <p className="text-sm text-gray-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }
    return spinner;
};

export default LoadingSpinner;
