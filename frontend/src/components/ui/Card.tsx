import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false 
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2, shadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)' } : undefined}
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};