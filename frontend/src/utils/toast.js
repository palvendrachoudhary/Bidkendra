export const showToast = (message) => {
  const existingToast = document.getElementById('app-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.className = 'fixed bottom-24 right-8 bg-slate-800 text-white px-4 py-2 rounded shadow-lg z-[100] transition-opacity duration-300';
  toast.innerText = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
};
