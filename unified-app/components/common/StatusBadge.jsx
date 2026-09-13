import React from 'react';
import { getStatusColor } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

export default function StatusBadge({ status, className = '' }) {
  const { t } = useLanguage();
  const colorClass = getStatusColor(status);
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${colorClass} ${className}`}>
      {t(status)}
    </span>
  );
}
