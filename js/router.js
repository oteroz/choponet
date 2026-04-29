// Router — hash-based para que funcione en GitHub Pages sin server-side rewrites.
// Rutas: #/login, #/feed, #/post/:id, #/logout

const routes = new Map();

export function registerRoute(pattern, handler) {
  routes.set(pattern, handler);
}

export function navigate(hash) {
  if (window.location.hash === hash) {
    handleRoute();
  } else {
    window.location.hash = hash;
  }
}

function matchRoute(hash) {
  const path = hash.replace(/^#/, '') || '/';
  for (const [pattern, handler] of routes) {
    const params = matchPattern(pattern, path);
    if (params) return { handler, params };
  }
  return null;
}

function matchPattern(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (p !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

function handleRoute() {
  const match = matchRoute(window.location.hash);
  if (match) {
    match.handler(match.params);
  }
}

export function startRouter(defaultHash = '#/feed') {
  window.addEventListener('hashchange', handleRoute);
  if (!window.location.hash) {
    window.location.hash = defaultHash;
  } else {
    handleRoute();
  }
}
