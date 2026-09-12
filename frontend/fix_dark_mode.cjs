const fs = require('fs');
const path = 'frontend/src/pages/BidderVerification.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace Summary elements
content = content.replace(
  'className="bg-slate-50 p-6 rounded-xl border border-slate-200"',
  'className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700"'
);
content = content.replace(
  'className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-4"',
  'className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mt-4"'
);
content = content.replace(
  'className="font-semibold text-slate-800 flex items-center gap-2 mb-2"',
  'className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2"'
);
content = content.replace(
  'className="font-semibold text-slate-800 flex items-center gap-2 mb-2"', // Need global replacement if possible, or just repeat
  'className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2"'
);
content = content.replaceAll(
  'className="text-slate-700 text-sm"',
  'className="text-slate-700 dark:text-slate-300 text-sm"'
);
content = content.replaceAll(
  'className="text-slate-700 text-sm whitespace-pre-wrap"',
  'className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap"'
);

// Tabs replacement
content = content.replaceAll(
  "className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${selectedIndex === idx ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}",
  "className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${selectedIndex === idx ? 'bg-navy dark:bg-saffron text-white dark:text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}"
);

content = content.replaceAll(
  "className={`font-medium pb-2 -mb-2 border-b-2 ${activeTab === 'compliance' ? 'text-navy border-navy' : 'text-slate-500 border-transparent hover:text-slate-700'}`}",
  "className={`font-medium pb-2 -mb-2 border-b-2 transition-colors ${activeTab === 'compliance' ? 'text-navy dark:text-saffron border-navy dark:border-saffron' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}"
);

content = content.replaceAll(
  "className={`font-medium pb-2 -mb-2 border-b-2 ${activeTab === 'summary' ? 'text-navy border-navy' : 'text-slate-500 border-transparent hover:text-slate-700'}`}",
  "className={`font-medium pb-2 -mb-2 border-b-2 transition-colors ${activeTab === 'summary' ? 'text-navy dark:text-saffron border-navy dark:border-saffron' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}"
);

content = content.replaceAll(
  "className={`font-medium pb-2 -mb-2 border-b-2 ${activeTab === 'email' ? 'text-navy border-navy' : 'text-slate-500 border-transparent hover:text-slate-700'}`}",
  "className={`font-medium pb-2 -mb-2 border-b-2 transition-colors ${activeTab === 'email' ? 'text-navy dark:text-saffron border-navy dark:border-saffron' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}"
);

content = content.replaceAll(
  'className="flex gap-4 border-b border-slate-200 mb-6 pb-2"',
  'className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6 pb-2"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed dark mode in BidderVerification!');
