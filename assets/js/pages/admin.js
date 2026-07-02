Pages.admin = async function(container) {
  let dashboard = { totalMembers: 0, pendingMembers: 0, totalActivities: 0, activeMembers: 0 };
  try {
    dashboard = await API.getDashboard();
  } catch { /* use defaults */ }

  container.innerHTML = `
    <div class="container py-4">
      <h2 class="section-title">Bảng điều khiển Admin</h2>

      <div class="row g-4 mb-4">
        <div class="col-6 col-md-3">
          <div class="card stat-card">
            <div class="stat-number">${dashboard.totalMembers}</div>
            <div class="stat-label">Thành viên</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card stat-card">
            <div class="stat-number text-warning">${dashboard.pendingMembers}</div>
            <div class="stat-label">Chờ duyệt</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card stat-card">
            <div class="stat-number">${dashboard.totalActivities}</div>
            <div class="stat-label">Hoạt động</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card stat-card">
            <div class="stat-number">${dashboard.activeMembers}</div>
            <div class="stat-label">Đang hoạt động</div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-3">
          <div class="admin-sidebar">
            <nav class="nav flex-column" id="adminNav">
              <a class="nav-link active" href="#" data-tab="members"><i class="bi bi-people me-2"></i>Thành viên</a>
              <a class="nav-link" href="#" data-tab="pending"><i class="bi bi-person-check me-2"></i>Duyệt tài khoản</a>
              <a class="nav-link" href="#" data-tab="activities"><i class="bi bi-calendar-event me-2"></i>Hoạt động</a>
              <a class="nav-link" href="#" data-tab="announcements"><i class="bi bi-megaphone me-2"></i>Thông báo</a>
              <a class="nav-link" href="#" data-tab="executive"><i class="bi bi-diagram-3 me-2"></i>Ban Chủ nhiệm</a>
              <a class="nav-link" href="#" data-tab="audit"><i class="bi bi-journal-text me-2"></i>Nhật ký</a>
              <a class="nav-link" href="#" data-tab="settings"><i class="bi bi-gear me-2"></i>Cài đặt</a>
            </nav>
          </div>
        </div>
        <div class="col-lg-9">
          <div id="adminContent"></div>
        </div>
      </div>
    </div>
  `;

  const content = document.getElementById('adminContent');

  async function loadTab(tab) {
    switch (tab) {
      case 'members': await MemberCRUD.loadInto(content); break;
      case 'pending': await PendingCRUD.loadInto(content); break;
      case 'activities': await ActivityCRUD.loadInto(content); break;
      case 'announcements': await AnnouncementCRUD.loadInto(content); break;
      case 'executive': content.innerHTML = await renderAdminExecutive(); break;
      case 'audit': content.innerHTML = await renderAdminAudit(); break;
      case 'settings': content.innerHTML = await renderAdminSettings(); bindAdminSettings(); break;
    }
  }

  document.getElementById('adminNav').addEventListener('click', async (e) => {
    const link = e.target.closest('[data-tab]');
    if (!link) return;
    e.preventDefault();
    document.querySelectorAll('#adminNav .nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    await loadTab(link.dataset.tab);
  });

  await MemberCRUD.loadInto(content);
};

async function renderAdminExecutive() {
  const board = await API.getExecutiveBoard();
  return `
    <div class="card">
      <div class="card-header bg-white"><h5 class="mb-0">Ban Chủ nhiệm (${board.length})</h5></div>
      <div class="card-body">
        <div class="row g-3">
          ${board.map(m => `
            <div class="col-md-4">
              <div class="border rounded p-3 text-center h-100">
                <strong>${Utils.escapeHtml(m.name)}</strong><br>
                <small class="text-primary">${Utils.escapeHtml(m.position)}</small>
                ${m.email ? `<p class="small text-muted mt-2 mb-0">${Utils.escapeHtml(m.email)}</p>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        <p class="text-muted small mt-3 mb-0">Chỉnh sửa Ban Chủ nhiệm trực tiếp trên Google Sheet <strong>ExecutiveBoard</strong>.</p>
      </div>
    </div>
  `;
}

async function renderAdminAudit() {
  let logs = [];
  try { logs = await API.getAuditLog(); } catch { logs = []; }
  return `
    <div class="card">
      <div class="card-header bg-white"><h5 class="mb-0">Nhật ký hoạt động</h5></div>
      <div class="card-body">
        ${logs.length ? logs.map(l => `
          <div class="border-bottom py-2 small">
            <strong>${Utils.escapeHtml(l.action)}</strong> — ${Utils.escapeHtml(l.user)} — ${Utils.formatDateTime(l.timestamp)}
            ${l.details ? `<br><span class="text-muted">${Utils.escapeHtml(l.details)}</span>` : ''}
          </div>
        `).join('') : '<p class="text-muted mb-0">Chưa có nhật ký hoạt động</p>'}
      </div>
    </div>
  `;
}

async function renderAdminSettings() {
  let settings = {};
  try { settings = await API.getSettings(); } catch { settings = {}; }
  const logoUrl = Utils.clubLogoUrl(settings.club_logo);
  return `
    <div class="card">
      <div class="card-header bg-white"><h5 class="mb-0">Cài đặt CLB</h5></div>
      <div class="card-body">
        <div class="row g-4 align-items-center">
          <div class="col-md-4 text-center">
            <img src="${logoUrl}" alt="Logo CLB" class="club-logo-preview" id="adminClubLogoPreview">
          </div>
          <div class="col-md-8">
            <h6>Logo CLB</h6>
            <p class="text-muted small mb-3">Logo hiển thị trên thanh điều hướng, chân trang và trang đăng nhập. Khuyến nghị ảnh vuông PNG/JPG, tối đa 5MB.</p>
            <button type="button" class="btn btn-primary" id="btnChangeClubLogo">
              <i class="bi bi-image me-1"></i>Đổi logo CLB
            </button>
          </div>
        </div>
        <hr>
        <div class="small text-muted">
          <strong>Tên CLB:</strong> ${Utils.escapeHtml(settings.club_name || CONFIG.CLUB_NAME)}<br>
          <strong>Email liên hệ:</strong> ${Utils.escapeHtml(settings.contact_email || 'clbsv5t.dongnai@gmail.com')}
        </div>
      </div>
    </div>
  `;
}

function bindAdminSettings() {
  Utils.bindImageFallback(document.getElementById('adminClubLogoPreview'));
  document.getElementById('btnChangeClubLogo')?.addEventListener('click', async () => {
    try {
      await Utils.uploadClubLogoFile((result) => {
        const preview = document.getElementById('adminClubLogoPreview');
        if (preview) {
          preview.src = Utils.clubLogoUrl(result.url);
          Utils.bindImageFallback(preview);
        }
        Utils.showToast('Đã cập nhật logo CLB', 'success');
      });
    } catch (err) { /* handled */ }
  });
}
