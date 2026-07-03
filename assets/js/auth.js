/**
 * Quản lý xác thực và phiên đăng nhập
 */
const Auth = {
  STORAGE_KEY: 'sv5t_session',
  _loggingOut: false,

  getSession() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  getToken() {
    return this.getSession()?.token || null;
  },

  getUser() {
    return this.getSession()?.user || null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  hasRole(...roles) {
    const user = this.getUser();
    if (!user) return roles.includes('guest');
    return roles.includes(user.role);
  },

  isAdmin() { return this.hasRole('admin'); },
  isExecutive() { return this.hasRole('admin', 'executive'); },
  isMember() { return this.hasRole('admin', 'executive', 'member'); },

  async login(identifier, password) {
    const data = await API.login(identifier, password);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    AppStore.clear();
    this.updateNavbar();
    return data.user;
  },

  logout() {
    if (this._loggingOut) return;
    this._loggingOut = true;
    const token = this.getToken();
    this._clearSession();
    if (token) {
      API.request('logout', { token }, { silent: true, skipAuthHandler: true }).catch(() => {});
    }
    Utils.showToast('Đã đăng xuất', 'info');
    Router.go('home');
    this._loggingOut = false;
  },

  handleUnauthorized(message) {
    if (this._loggingOut) return;
    this._loggingOut = true;
    const wasLoggedIn = !!localStorage.getItem(this.STORAGE_KEY);
    this._clearSession();
    if (wasLoggedIn) {
      Utils.showToast(message || 'Phiên đăng nhập đã hết hạn', 'warning');
    }
    Router.go('home');
    this._loggingOut = false;
  },

  _clearSession() {
    localStorage.removeItem(this.STORAGE_KEY);
    AppStore.clear();
    this.updateNavbar();
  },

  updateNavbar() {
    const authNav = document.getElementById('authNav');
    const user = this.getUser();

    if (user) {
      let dashboardLink = '';
      if (this.isAdmin()) {
        dashboardLink = `<li class="nav-item"><a class="nav-link" href="#admin" data-page="admin"><i class="bi bi-gear"></i> Quản trị</a></li>`;
      } else if (this.isExecutive()) {
        dashboardLink = `<li class="nav-item"><a class="nav-link" href="#manage" data-page="manage"><i class="bi bi-kanban"></i> Quản lý</a></li>`;
      }

      authNav.innerHTML = `
        ${dashboardLink}
        <li class="nav-item"><a class="nav-link" href="#my-profile" data-page="my-profile"><i class="bi bi-person-circle"></i> ${Utils.escapeHtml(user.name)}</a></li>
        <li class="nav-item"><a class="nav-link" href="#" id="btnLogout"><i class="bi bi-box-arrow-right"></i> Đăng xuất</a></li>
      `;
      document.getElementById('btnLogout')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    } else {
      authNav.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="#login" data-page="login"><i class="bi bi-box-arrow-in-right"></i> Đăng nhập</a></li>
        <li class="nav-item"><a class="nav-link btn btn-warning btn-sm text-dark ms-lg-2 px-3" href="#register" data-page="register">Đăng ký</a></li>
      `;
    }
  },

  redirectAfterLogin(user) {
    const pending = sessionStorage.getItem('post_login_hash');
    if (pending) {
      sessionStorage.removeItem('post_login_hash');
      window.location.hash = pending;
      return;
    }
    switch (user.role) {
      case 'admin': Router.go('admin'); break;
      case 'executive': Router.go('manage'); break;
      default: Router.go('my-profile'); break;
    }
  }
};
