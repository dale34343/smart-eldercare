/* This public experience has no connection to the private desktop service. */
(() => {
  function safeStorage(name) {
    const fallback = new Map();
    return {
      getItem(key) { try { return window[name].getItem(key); } catch { return fallback.get(key) || null; } },
      setItem(key, value) { try { window[name].setItem(key, value); } catch { fallback.set(key, String(value)); } }
    };
  }
  window.CareSession = safeStorage('sessionStorage');
  window.CarePreferences = safeStorage('localStorage');
  const key = 'eldercare-public-demo-v1';
  const apiError = (message, status = 400) => Object.assign(new Error(message), { status });
  let volatileState = null;
  let storageAvailable = true;
  try { localStorage.setItem(key + '-probe', '1'); localStorage.removeItem(key + '-probe'); }
  catch { storageAvailable = false; }

  function read() {
    if (!storageAvailable) return JSON.parse(JSON.stringify(volatileState || (volatileState = seed())));
    const raw = localStorage.getItem(key);
    if (!raw) {
      const state = seed();
      localStorage.setItem(key, JSON.stringify(state));
      return state;
    }
    let state;
    try { state = JSON.parse(raw); } catch { throw apiError('当前浏览器的体验记录损坏，请清除此网站的数据后重试'); }
    if (state.version !== 1 || !Array.isArray(state.orders)) throw apiError('体验记录版本不匹配，请清除此网站的数据后重试');
    return state;
  }

  function save(state) {
    if (storageAvailable) {
      try { localStorage.setItem(key, JSON.stringify(state)); }
      catch { throw apiError('浏览器存储空间不足，本次修改未保存'); }
    } else volatileState = state;
  }

  function project(state, role) {
    const result = view(state, role);
    result.mode = 'public-demo';
    result.storageAvailable = storageAvailable;
    return result;
  }

  window.PublicCareAPI = {
    async request(path, options = {}, token) {
      const body = options.body ? JSON.parse(options.body) : {};
      if (path === 'session') {
        if (!ROLES.includes(body.role)) throw apiError('请选择有效的体验身份');
        return { token: 'public-demo-' + body.role, state: project(read(), body.role) };
      }
      const role = String(token || '').replace(/^public-demo-/, '');
      if (!ROLES.includes(role)) throw apiError('请选择体验身份', 401);
      if (path === 'state') return project(read(), role);
      if (path === 'command') {
        const state = read();
        const result = command(state, role, body.action, body.data);
        save(state);
        return { ...result, state: project(state, role) };
      }
      throw apiError('不支持的操作', 404);
    }
  };
})();
