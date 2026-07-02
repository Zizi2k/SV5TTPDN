/**
 * Hash-based SPA Router
 */
const Router = {
  routes: {},
  currentPage: null,

  register(name, handler, options = {}) {
    this.routes[name] = { handler, ...options };
  },

  init() {
    window.addEventListener('hashchange', () => this.navigate());
    this.navigate();
  },

  navigate(page, params = {}) {
    const hash = page || window.location.hash.slice(1) || 'home';
    const [routeName, ...paramParts] = hash.split('/');
    const routeParams = { ...params };

    if (paramParts.length) {
      if (routeName === 'profile') routeParams.id = paramParts[0];
      if (routeName === 'activities') routeParams.id = paramParts[0];
    }

    const route = this.routes[routeName];
    if (!route) {
      this.render404();
      return;
    }

    if (route.auth && !Auth.isLoggedIn()) {
      Utils.showToast('Vui lòng đăng nhập', 'warning');
      window.location.hash = 'login';
      return;
    }

    if (route.roles && !Auth.hasRole(...route.roles)) {
      Utils.showToast('Bạn không có quyền truy cập trang này', 'danger');
      window.location.hash = 'home';
      return;
    }

    this.currentPage = routeName;
    this.updateActiveNav(routeName);

    const container = document.getElementById('appContent');
    container.innerHTML = '<div class="page-enter"></div>';
    const pageEl = container.firstElementChild;

    route.handler(pageEl, routeParams).catch(err => {
      console.error(err);
      pageEl.innerHTML = `<div class="container py-5"><div class="alert alert-danger">${Utils.escapeHtml(err.message)}</div></div>`;
    });
  },

  updateActiveNav(page) {
    document.querySelectorAll('#navLinks .nav-link, #authNav .nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });
  },

  render404() {
    document.getElementById('appContent').innerHTML = `
      <div class="container py-5 text-center page-enter">
        <h1 class="display-1 text-primary">404</h1>
        <p class="lead">Trang không tồn tại</p>
        <a href="#home" class="btn btn-primary">Về trang chủ</a>
      </div>
    `;
  }
};
