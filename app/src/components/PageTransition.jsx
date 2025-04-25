import React, { useEffect, useState } from 'react';
import styles from './PageTransition.module.css';

const PageTransition = ({ children, type = 'page' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation on mount
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getClassNames = () => {
    if (type === 'fade') {
      return isVisible ? styles.fadeEnterActive : styles.fadeEnter;
    }
    if (type === 'slideUp') {
      return styles.slideUp;
    }
    // Default page transition
    return isVisible ? styles.pageEnterActive : styles.pageEnter;
  };

  return (
    <div className={getClassNames()}>
      {children}
    </div>
  );
};

export default PageTransition;
