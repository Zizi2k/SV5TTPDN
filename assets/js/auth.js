/**
 * Quản lý xác thực và phiên đăng nhập
 */
const Auth = {
  STORAGE_KEY: 'sv5t_session',

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
    this.updateNavbar();
    return data.user;
  },

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateNavbar();
    Router.navigate('home');
    Utils.showToast('Đã đăng xuất', 'info');
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
    switch (user.role) {
      case 'admin': Router.navigate('admin'); break;
      case 'executive': Router.navigate('manage'); break;
      default: Router.navigate('my-profile'); break;
    }
  }
};
