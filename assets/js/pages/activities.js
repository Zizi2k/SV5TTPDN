Pages.activities = async function(container, params) {
  if (params.id) {
    return Pages.activityDetail(container, params.id);
  }

  const activities = await API.getActivities();

  activities.forEach(a => {
    a.computedStatus = a.status || Utils.getActivityStatus(a.startDate, a.endDate);
  });

  const ongoing = activities.filter(a => a.computedStatus === 'ongoing');
  const upcoming = activities.filter(a => a.computedStatus === 'upcoming');
  const completed = activities.filter(a => a.computedStatus === 'completed');

  container.innerHTML = `
    <div class="container py-4">
      <h2 class="section-title">Hoạt động CLB</h2>

      ${renderActivityGroup('Đang diễn ra', ongoing, 'ongoing', 'success')}
      ${renderActivityGroup('Sắp diễn ra', upcoming, 'upcoming', 'warning')}
      ${renderActivityGroup('Đã kết thúc', completed, 'completed', 'secondary')}
    </div>
  `;
};

function renderActivityGroup(title, items, status, color) {
  if (!items.length) return '';
  return `
    <section class="mb-5">
      <h4 class="mb-3"><span class="badge bg-${color} me-2">&nbsp;</span>${title} (${items.length})</h4>
      <div class="row g-4">
        ${items.map(a => {
          let timeInfo = '';
          if (status === 'ongoing') timeInfo = `<span class="text-success fw-semibold"><i class="bi bi-clock me-1"></i>Còn ${Utils.daysRemaining(a.endDate)} ngày</span>`;
          else if (status === 'upcoming') timeInfo = `<span class="text-warning fw-semibold"><i class="bi bi-clock me-1"></i>Bắt đầu sau ${Utils.daysUntil(a.startDate)} ngày</span>`;

          return `
            <div class="col-md-6 col-lg-4">
              <div class="card activity-card h-100">
                <div class="card-img-top bg-${color === 'warning' ? 'warning' : color === 'success' ? 'success' : 'secondary'} d-flex align-items-center justify-content-center" style="height:140px;${status === 'completed' ? 'opacity:0.7' : ''}">
                  <i class="bi bi-calendar-event text-white" style="font-size:2.5rem"></i>
                </div>
                <span class="status-badge ${Utils.statusClass(status)}">${Utils.statusLabel(status)}</span>
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title">${Utils.escapeHtml(a.name)}</h5>
                  <p class="card-text text-muted small flex-grow-1">${Utils.escapeHtml(a.description || '')}</p>
                  <p class="small mb-1"><i class="bi bi-geo-alt me-1"></i>${Utils.escapeHtml(a.location || 'Chưa cập nhật')}</p>
                  <p class="small mb-2"><i class="bi bi-calendar me-1"></i>${Utils.formatDate(a.startDate)} - ${Utils.formatDate(a.endDate)}</p>
                  ${timeInfo}
                  <div class="d-flex justify-content-between align-items-center mt-3">
                    <small class="text-muted"><i class="bi bi-people me-1"></i>${a.participants || 0} người tham gia</small>
                    <a href="#activities/${a.id}" class="btn btn-sm btn-primary">Chi tiết</a>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

Pages.activityDetail = async function(container, id) {
  const activities = await API.getActivities();
  const activity = activities.find(a => a.id === id) || activities[0];
  const status = activity.status || Utils.getActivityStatus(activity.startDate, activity.endDate);

  container.innerHTML = `
    <div class="container py-4">
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="#activities">Hoạt động</a></li>
          <li class="breadcrumb-item active">${Utils.escapeHtml(activity.name)}</li>
        </ol>
      </nav>

      <div class="card">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <h2 class="mb-0">${Utils.escapeHtml(activity.name)}</h2>
            <span class="badge ${Utils.statusClass(status)} fs-6 px-3 py-2">${Utils.statusLabel(status)}</span>
          </div>

          <div class="row g-4 mb-4">
            <div class="col-md-6">
              <p><i class="bi bi-calendar text-primary me-2"></i><strong>Thời gian:</strong> ${Utils.formatDate(activity.startDate)} - ${Utils.formatDate(activity.endDate)}</p>
              <p><i class="bi bi-geo-alt text-primary me-2"></i><strong>Địa điểm:</strong> ${Utils.escapeHtml(activity.location || 'Chưa cập nhật')}</p>
              <p><i class="bi bi-people text-primary me-2"></i><strong>Tham gia:</strong> ${activity.participants || 0} người</p>
            </div>
            <div class="col-md-6">
              ${status === 'ongoing' ? `<div class="alert alert-success"><i class="bi bi-clock me-2"></i>Còn <strong>${Utils.daysRemaining(activity.endDate)}</strong> ngày</div>` : ''}
              ${status === 'upcoming' ? `<div class="alert alert-warning"><i class="bi bi-clock me-2"></i>Bắt đầu sau <strong>${Utils.daysUntil(activity.startDate)}</strong> ngày</div>` : ''}
            </div>
          </div>

          <h5>Mô tả</h5>
          <p>${Utils.escapeHtml(activity.description || 'Chưa có mô tả')}</p>

          ${activity.report ? `
            <h5 class="mt-4">Báo cáo</h5>
            <p>${Utils.escapeHtml(activity.report)}</p>
          ` : ''}

          <div class="mt-4 d-flex gap-2 flex-wrap">
            ${status !== 'completed' && Auth.isMember() ? `
              <button class="btn btn-primary" id="btnJoin"><i class="bi bi-person-plus me-2"></i>Tham gia</button>
            ` : ''}
            <a href="#activities" class="btn btn-outline-secondary"><i class="bi bi-arrow-left me-2"></i>Quay lại</a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnJoin')?.addEventListener('click', async () => {
    try {
      await API.joinActivity(id);
      Utils.showToast('Đã đăng ký tham gia hoạt động!', 'success');
    } catch (err) { /* handled */ }
  });
};
