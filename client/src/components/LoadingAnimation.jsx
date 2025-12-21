import React from 'react';

const LoadingAnimation = ({ text = "Thinking" }) => {
    return (
        <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg max-w-[200px]">
            <div className="flex space-x-1">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
            </div>
            <span className="text-sm text-gray-500 font-medium ml-2 animate-pulse">{text}...</span>
        </div>
    );
};

export default LoadingAnimation;
