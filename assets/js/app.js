/**
 * Khởi tạo ứng dụng
 */
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavbar();

  Router.register('home', Pages.home);
  Router.register('login', Pages.login);
  Router.register('register', Pages.register);
  Router.register('members', Pages.members);
  Router.register('profile', Pages.profile);
  Router.register('activities', Pages.activities);
  Router.register('announcements', Pages.announcements);
  Router.register('executive-board', Pages.executiveBoard);
  Router.register('contact', Pages.contact);
  Router.register('my-profile', Pages.myProfile, { auth: true, roles: ['admin', 'executive', 'member'] });
  Router.register('manage', Pages.manage, { auth: true, roles: ['admin', 'executive'] });
  Router.register('admin', Pages.admin, { auth: true, roles: ['admin'] });

  Router.init();
});
