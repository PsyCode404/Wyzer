import React from 'react';

const DashboardCard = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      {title && <h2 className="text-lg font-semibold mb-4 text-text">{title}</h2>}
      {children}
    </div>
  );
};

export default DashboardCard;
