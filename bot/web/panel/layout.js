(() => {
  const path = location.pathname.split('/').pop() || '';
  if (!path.includes('login.html') && !localStorage.getItem('jwt')) {
    location.href = 'login.html';
    return;
  }

  window.apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('jwt');
    const h = { ...(options.headers || {}), Authorization: token ? `Bearer ${token}` : '' };
    if (!(options.body instanceof FormData) && !h['Content-Type']) {
      h['Content-Type'] = 'application/json';
    }
    const r = await fetch(endpoint, { ...options, headers: h });
    return r;
  };

  window.showToast = (message, type = 'success') => {
    const el = document.createElement('div');
    el.className =
      'fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm shadow-lg border ' +
      (type === 'error'
        ? 'bg-red-950/90 border-red-500/40 text-red-100'
        : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  };

  let loadEl;
  window.showLoading = () => {
    if (loadEl) return;
    loadEl = document.createElement('div');
    loadEl.className =
      'fixed inset-0 z-40 bg-black/50 flex items-center justify-center';
    loadEl.innerHTML =
      '<div class="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>';
    document.body.appendChild(loadEl);
  };
  window.hideLoading = () => {
    if (loadEl) {
      loadEl.remove();
      loadEl = null;
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('layout-mount');
    if (!mount) return;
    const current = path || 'dashboard.html';
    const items = [
      ['dashboard.html', 'Dashboard'],
      ['bots.html', 'Bots'],
      ['subbots.html', 'Sub-bots'],
      ['grupos.html', 'Grupos'],
      ['usuarios.html', 'Usuarios'],
      ['gacha.html', 'Gacha'],
      ['configuracion.html', 'Configuración'],
    ];
    mount.innerHTML = `
      <aside class="w-56 shrink-0 bg-[#141414] border-r border-white/10 min-h-screen p-4 hidden md:block">
        <div class="font-semibold text-violet-400 mb-6">Kirby Panel</div>
        <nav class="space-y-1 text-sm">
          ${items
            .map(
              ([href, label]) => `
            <a href="${href}" class="block rounded-lg px-3 py-2 ${
                href === current
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-gray-300 hover:bg-white/5'
              }">${label}</a>`
            )
            .join('')}
        </nav>
        <button id="logout" class="mt-8 text-xs text-gray-500 hover:text-white">Cerrar sesión</button>
      </aside>
    `;
    document.getElementById('logout')?.addEventListener('click', () => {
      localStorage.removeItem('jwt');
      location.href = 'login.html';
    });
  });
})();
