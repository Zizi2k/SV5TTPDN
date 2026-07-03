/**
 * Hash-based SPA Router — điều hướng không reload trang
 */
const PAGE_TITLES = {
  home: 'Trang chủ',
  login: 'Đăng nhập',
  register: 'Đăng ký',
  members: 'Thành viên',
  profile: 'Hồ sơ thành viên',
  activities: 'Hoạt động',
  checkin: 'Điểm danh',
  announcements: 'Thông báo',
  'executive-board': 'Ban Chủ nhiệm',
  contact: 'Liên hệ',
  'my-profile': 'Hồ sơ của tôi',
  manage: 'Quản lý CLB',
  admin: 'Quản trị'
};

const Router = {
  routes: {},
  currentPage: null,
  currentParams: {},
  _navigating: false,
  _abortController: null,

  register(name, handler, options = {}) {
    this.routes[name] = { handler, ...options };
  },

  init() {
    window.addEventListener('hashchange', () => this.navigate());
    this.navigate();
  },

  navigate(page, params = {}, options = {}) {
    const hash = page || window.location.hash.slice(1) || 'home';
    const [routeName, ...paramParts] = hash.split('/');
    const routeParams = { ...params };

    if (paramParts.length) {
      if (routeName === 'profile') routeParams.id = paramParts[0];
      if (routeName === 'activities') routeParams.id = paramParts[0];
      if (routeName === 'checkin' && paramParts.length >= 2) {
        routeParams.activityId = paramParts[0];
        routeParams.code = paramParts[1].toUpperCase();
      }
    }

    if (!options.force && routeName === this.currentPage &&
        JSON.stringify(routeParams) === JSON.stringify(this.currentParams)) {
      return;
    }

    const route = this.routes[routeName];
    if (!route) {
      this.render404();
      return;
    }

    if (route.auth && !Auth.isLoggedIn()) {
      Utils.showToast('Vui lòng đăng nhập', 'warning');
      this.go('login');
      return;
    }

    if (route.roles && !Auth.hasRole(...route.roles)) {
      Utils.showToast('Bạn không có quyền truy cập trang này', 'danger');
      this.go('home');
      return;
    }

    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();

    this.currentPage = routeName;
    this.currentParams = routeParams;
    this.updateActiveNav(routeName);
    this.updateTitle(routeName);
    this.closeMobileNav();

    const container = document.getElementById('appContent');
    Utils.showPageSkeleton(container);

    const pageEl = container.firstElementChild;
    const signal = this._abortController.signal;

    this._navigating = true;

    Promise.resolve(route.handler(pageEl, routeParams, { signal }))
      .then(() => {
        if (!signal.aborted) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      })
      .catch(err => {
        if (signal.aborted || err?.name === 'AbortError') return;
        console.error(err);
        pageEl.innerHTML = `
          <div class="container py-5 page-enter">
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>${Utils.escapeHtml(err.message || 'Không thể tải trang')}
            </div>
            <button class="btn btn-primary" onclick="Router.refresh()">Thử lại</button>
          </div>`;
      })
      .finally(() => {
        if (!signal.aborted) this._navigating = false;
      });
  },

  go(page) {
    if (window.location.hash === `#${page}`) {
      this.navigate(page, {}, { force: true });
    } else {
      window.location.hash = page;
    }
  },

  refresh() {
    AppStore.invalidateMany([
      'getMembers', 'getMember', 'getActivities', 'getActivity',
      'getAnnouncements', 'getExecutiveBoard', 'getDashboard',
      'getPendingMembers', 'getAuditLog', 'getScores'
    ]);
    this.navigate(this.currentPage, this.currentParams, { force: true });
  },

  goBack() {
    window.history.back();
  },

  updateTitle(routeName) {
    const pageTitle = PAGE_TITLES[routeName] || 'Trang';
    document.title = `${pageTitle} | ${CONFIG.CLUB_SHORT}`;
  },

  closeMobileNav() {
    const nav = document.getElementById('navbarNav');
    if (nav?.classList.contains('show')) {
      bootstrap.Collapse.getOrCreateInstance(nav).hide();
    }
  },

  updateActiveNav(page) {
    document.querySelectorAll('#navLinks .nav-link, #authNav .nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });
  },

  render404() {
    document.title = `404 | ${CONFIG.CLUB_SHORT}`;
    document.getElementById('appContent').innerHTML = `
      <div class="container py-5 text-center page-enter">
        <h1 class="display-1 text-primary">404</h1>
        <p class="lead">Trang không tồn tại</p>
        <a href="#home" class="btn btn-primary" data-spa-link>Về trang chủ</a>
      </div>
    `;
  }
};
