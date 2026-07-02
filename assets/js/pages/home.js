const Pages = {};

Pages.home = async function(container) {
  const [activities, announcements, members] = await Promise.all([
    API.getActivities(),
    API.getAnnouncements(),
    API.getMembers()
  ]);

  const ongoing = activities.filter(a => a.status === 'ongoing' || Utils.getActivityStatus(a.startDate, a.endDate) === 'ongoing');
  const upcoming = activities.filter(a => a.status === 'upcoming' || Utils.getActivityStatus(a.startDate, a.endDate) === 'upcoming');
  const featured = members.slice(0, 4);
  const latestNews = announcements.slice(0, 3);

  container.innerHTML = `
    <section class="hero-banner">
      <div class="container text-center position-relative">
        <h1>Chào mừng đến với ${CONFIG.CLUB_NAME}</h1>
        <p class="lead mt-3">Nơi kết nối – Phát triển – Cống hiến</p>
        <div class="mt-4 d-flex gap-3 justify-content-center flex-wrap">
          ${!Auth.isLoggedIn() ? `
            <a href="#login" class="btn btn-warning btn-lg px-4"><i class="bi bi-box-arrow-in-right me-2"></i>Đăng nhập</a>
            <a href="#register" class="btn btn-outline-light btn-lg px-4"><i class="bi bi-person-plus me-2"></i>Đăng ký</a>
          ` : `
            <a href="#activities" class="btn btn-warning btn-lg px-4"><i class="bi bi-calendar-event me-2"></i>Xem hoạt động</a>
            <a href="#my-profile" class="btn btn-outline-light btn-lg px-4"><i class="bi bi-person me-2"></i>Hồ sơ cá nhân</a>
          `}
        </div>
      </div>
    </section>

    <div class="container py-5 page-enter">
      ${ongoing.length ? renderActivitySection('Hoạt động đang diễn ra', ongoing, 'ongoing') : ''}
      ${upcoming.length ? renderActivitySection('Hoạt động sắp diễn ra', upcoming, 'upcoming') : ''}

      <section class="mb-5">
        <h3 class="section-title">Tin mới</h3>
        <div class="row g-3">
          ${latestNews.map(n => `
            <div class="col-md-4">
              <div class="card h-100">
                <div class="card-body">
                  ${n.pinned ? '<span class="badge bg-warning text-dark mb-2"><i class="bi bi-pin-angle"></i> Ghim</span>' : ''}
                  ${n.important ? '<span class="badge bg-danger mb-2"><i class="bi bi-exclamation-circle"></i> Quan trọng</span>' : ''}
                  <h5 class="card-title">${Utils.escapeHtml(n.title)}</h5>
                  <p class="card-text text-muted small">${Utils.escapeHtml(n.content.substring(0, 100))}...</p>
                  <small class="text-muted">${Utils.timeAgo(n.createdAt)}</small>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="text-center mt-3">
          <a href="#announcements" class="btn btn-outline-primary">Xem tất cả thông báo</a>
        </div>
      </section>

      <section class="mb-5">
        <h3 class="section-title">Thành viên tiêu biểu</h3>
        <div class="row g-4">
          ${featured.map(m => renderMemberCard(m)).join('')}
        </div>
        <div class="text-center mt-3">
          <a href="#members" class="btn btn-outline-primary">Xem tất cả thành viên</a>
        </div>
      </section>
    </div>
  `;
};

function renderActivitySection(title, items, status) {
  return `
    <section class="mb-5">
      <h3 class="section-title">${title}</h3>
      <div class="row g-4">
        ${items.slice(0, 3).map(a => renderActivityCard(a, status)).join('')}
      </div>
    </section>
  `;
}

function renderActivityCard(a, status) {
  const st = status || a.status || Utils.getActivityStatus(a.startDate, a.endDate);
  let timeInfo = '';
  if (st === 'ongoing') timeInfo = `Còn ${Utils.daysRemaining(a.endDate)} ngày`;
  else if (st === 'upcoming') timeInfo = `Bắt đầu sau ${Utils.daysUntil(a.startDate)} ngày`;

  return `
    <div class="col-md-4">
      <div class="card activity-card h-100">
        <div class="card-img-top bg-primary d-flex align-items-center justify-content-center" style="height:160px">
          <i class="bi bi-calendar-event text-white" style="font-size:3rem"></i>
        </div>
        <span class="status-badge ${Utils.statusClass(st)}">${Utils.statusLabel(st)}</span>
        <div class="card-body">
          <h5 class="card-title">${Utils.escapeHtml(a.name)}</h5>
          <p class="card-text text-muted small">${Utils.escapeHtml(a.description || '')}</p>
          <p class="text-primary fw-semibold small mb-2"><i class="bi bi-clock me-1"></i>${timeInfo}</p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted"><i class="bi bi-people me-1"></i>${a.participants || 0} người</small>
            <a href="#activities/${a.id}" class="btn btn-sm btn-primary">Chi tiết</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderMemberCard(m) {
  return `
    <div class="col-sm-6 col-lg-3">
      <div class="card member-card h-100">
        <div class="bg-primary" style="height:60px"></div>
        <img src="${Utils.avatarUrl(m.avatar, m.name)}" alt="${Utils.escapeHtml(m.name)}" class="avatar">
        <div class="card-body">
          <span class="role-badge">${Utils.escapeHtml(m.role)}</span>
          <h5 class="card-title mb-1">${Utils.escapeHtml(m.name)}</h5>
          <p class="text-muted small mb-2">${Utils.escapeHtml(m.faculty || '')}</p>
          <p class="text-muted small mb-3">${Utils.escapeHtml(m.school || '')}</p>
          <a href="#profile/${m.id}" class="btn btn-sm btn-outline-primary">Xem hồ sơ</a>
        </div>
      </div>
    </div>
  `;
}

Pages.renderMemberCard = renderMemberCard;
Pages.renderActivityCard = renderActivityCard;
