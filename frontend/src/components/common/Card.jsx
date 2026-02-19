import React from 'react';

const Card = ({ children, className = '', title }) => {
    return (
        <div className={`bg-white dark:bg-dark-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700 p-6 ${className} fade-in`}>
            {title && <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{title}</h3>}
            {children}
        </div>
    );
};

export default Card;
