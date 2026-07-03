/**
 * Khởi tạo SPA — shell cố định, nội dung tải qua AJAX
 */
document.addEventListener('DOMContentLoaded', () => {
  const verEl = document.getElementById('appVersion');
  if (verEl && CONFIG.APP_VERSION) {
    verEl.textContent = `v${CONFIG.APP_VERSION} · SPA`;
  }

  initSpaNavigation();
  Auth.updateNavbar();
  Utils.loadClubBranding();

  Router.register('home', Pages.home);
  Router.register('login', Pages.login);
  Router.register('register', Pages.register);
  Router.register('members', Pages.members);
  Router.register('profile', Pages.profile);
  Router.register('activities', Pages.activities);
  Router.register('checkin', Pages.checkin);
  Router.register('announcements', Pages.announcements);
  Router.register('executive-board', Pages.executiveBoard);
  Router.register('contact', Pages.contact);
  Router.register('my-profile', Pages.myProfile, { auth: true, roles: ['admin', 'executive', 'member'] });
  Router.register('manage', Pages.manage, { auth: true, roles: ['admin', 'executive'] });
  Router.register('admin', Pages.admin, { auth: true, roles: ['admin'] });

  Router.init();
});

/**
 * Bắt mọi link nội bộ (#) — không reload trang
 */
function initSpaNavigation() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute('data-bs-toggle')) return;

    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    e.preventDefault();
    const target = href.slice(1);
    if (!target) return;

    if (window.location.hash === href) {
      Router.navigate(target, {}, { force: true });
    } else {
      window.location.hash = target;
    }
  });

  // Ngăn form GET submit gây reload (nếu có)
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.tagName === 'FORM' && !form.hasAttribute('data-ajax')) {
      const method = (form.getAttribute('method') || 'get').toLowerCase();
      if (method === 'get' && !form.hasAttribute('action')) {
        e.preventDefault();
      }
    }
  });
}
