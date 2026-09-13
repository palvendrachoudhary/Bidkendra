import React from 'react';

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-navy dark:bg-saffron text-white dark:text-slate-950 hover:bg-navy-light dark:hover:bg-saffron-dark focus:ring-navy dark:focus:ring-saffron",
    secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-navy dark:focus:ring-slate-400",
    accent: "bg-saffron text-white hover:bg-saffron-dark focus:ring-saffron",
    danger: "bg-danger text-white hover:bg-red-600 focus:ring-danger"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}