// Toast — notificaciones efímeras simples.

const toastEl = () => document.getElementById('toast');
let hideTimer = null;

export function showToast(message, type = 'info', duration = 2800) {
  const el = toastEl();
  if (!el) return;

  el.textContent = message;
  el.className = 'toast';
  if (type === 'error') el.classList.add('toast-error');
  if (type === 'success') el.classList.add('toast-success');
  el.hidden = false;

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    el.hidden = true;
  }, duration);
}
