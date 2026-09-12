const HINDI_MONTHS = {
  Jan: 'जनवरी', Feb: 'फरवरी', Mar: 'मार्च', Apr: 'अप्रैल', May: 'मई', Jun: 'जून',
  Jul: 'जुलाई', Aug: 'अगस्त', Sep: 'सितंबर', Sept: 'सितंबर', Oct: 'अक्टूबर', Nov: 'नवंबर', Dec: 'दिसंबर',
  January: 'जनवरी', February: 'फरवरी', March: 'मार्च', April: 'अप्रैल', June: 'जून',
  July: 'जुलाई', August: 'अगस्त', September: 'सितंबर', October: 'अक्टूबर', November: 'नवंबर', December: 'दिसंबर'
};

export const formatDate = (dateString, lang = 'en') => {
  if (!dateString) return '';
  const isHindi = lang === 'hi';
  const locale = isHindi ? 'hi-IN' : 'en-IN';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  try {
    let formatted = new Date(dateString).toLocaleDateString(locale, options);
    if (isHindi) {
      formatted = formatted
        .replace(/\bpm\b/gi, 'अपराह्न')
        .replace(/\bam\b/gi, 'पूर्वाह्न');
      for (const [enMonth, hiMonth] of Object.entries(HINDI_MONTHS)) {
        const mRegex = new RegExp(`\\b${enMonth}\\b`, 'gi');
        formatted = formatted.replace(mRegex, hiMonth);
      }
    }
    return formatted;
  } catch (e) {
    let fallback = new Date(dateString).toLocaleDateString('en-IN', options);
    if (isHindi) {
      fallback = fallback
        .replace(/\bpm\b/gi, 'अपराह्न')
        .replace(/\bam\b/gi, 'पूर्वाह्न');
      for (const [enMonth, hiMonth] of Object.entries(HINDI_MONTHS)) {
        const mRegex = new RegExp(`\\b${enMonth}\\b`, 'gi');
        fallback = fallback.replace(mRegex, hiMonth);
      }
    }
    return fallback;
  }
};

export const getScoreColor = (score) => {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
};

export const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'verified':
    case 'completed':
    case 'active':
      return 'bg-success/10 text-success border-success/20';
    case 'pending':
    case 'in progress':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'failed':
    case 'rejected':
      return 'bg-danger/10 text-danger border-danger/20';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};