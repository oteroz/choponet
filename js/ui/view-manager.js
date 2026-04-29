// View manager — muestra/oculta secciones [data-view] de la SPA.

export function showView(viewName) {
  const views = document.querySelectorAll('.view[data-view]');
  views.forEach((v) => {
    v.hidden = v.dataset.view !== viewName;
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function setUserTag(nick) {
  const el = document.getElementById('user-tag');
  if (!el) return;
  if (nick) {
    el.textContent = nick;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

export function setBottomNavVisible(visible) {
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.hidden = !visible;
}
