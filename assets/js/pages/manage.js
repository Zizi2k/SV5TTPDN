Pages.manage = async function(container) {
  const [pending, activities, announcements] = await Promise.all([
    API.getPendingMembers(),
    API.getActivities(),
    API.getAnnouncements()
  ]);

  container.innerHTML = `
    <div class="container py-4">
      <h2 class="section-title">Quản lý CLB</h2>
      <div class="row g-4">
        <div class="col-lg-3">
          <div class="admin-sidebar">
            <nav class="nav flex-column" id="manageNav">
              <a class="nav-link active" href="#" data-tab="pending"><i class="bi bi-person-check me-2"></i>Duyệt thành viên <span class="badge bg-danger ms-1">${pending.length}</span></a>
              <a class="nav-link" href="#" data-tab="activities"><i class="bi bi-calendar-event me-2"></i>Hoạt động</a>
              <a class="nav-link" href="#" data-tab="announcements"><i class="bi bi-megaphone me-2"></i>Thông báo</a>
              <a class="nav-link" href="#" data-tab="scores"><i class="bi bi-trophy me-2"></i>Điểm hoạt động</a>
              <a class="nav-link" href="#" data-tab="attendance"><i class="bi bi-qr-code-scan me-2"></i>Điểm danh QR</a>
            </nav>
          </div>
        </div>
        <div class="col-lg-9">
          <div id="manageContent">
            ${renderPendingTab(pending)}
          </div>
        </div>
      </div>
    </div>
  `;

  const tabs = { pending, activities, announcements };

  document.getElementById('manageNav').addEventListener('click', (e) => {
    const link = e.target.closest('[data-tab]');
    if (!link) return;
    e.preventDefault();
    document.querySelectorAll('#manageNav .nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const tab = link.dataset.tab;
    const content = document.getElementById('manageContent');
    switch (tab) {
      case 'pending': content.innerHTML = renderPendingTab(tabs.pending); bindPendingEvents(); break;
      case 'activities': content.innerHTML = renderActivitiesTab(tabs.activities); break;
      case 'announcements': content.innerHTML = renderAnnouncementsTab(tabs.announcements); break;
      case 'scores': content.innerHTML = renderScoresTab(); break;
      case 'attendance': content.innerHTML = renderAttendanceTab(); break;
    }
  });

  bindPendingEvents();
};

function renderPendingTab(pending) {
  return `
    <div class="card">
      <div class="card-header bg-white"><h5 class="mb-0">Thành viên chờ duyệt</h5></div>
      <div class="card-body p-0">
        ${pending.length ? `
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr><th>Họ tên</th><th>MSSV</th><th>Trường</th><th>Email</th><th>Ngày đăng ký</th><th></th></tr>
              </thead>
              <tbody>
                ${pending.map(p => `
                  <tr>
                    <td>${Utils.escapeHtml(p.name)}</td>
                    <td>${Utils.escapeHtml(p.mssv)}</td>
                    <td>${Utils.escapeHtml(p.school)}</td>
                    <td>${Utils.escapeHtml(p.email)}</td>
                    <td>${Utils.formatDate(p.registeredAt)}</td>
                    <td>
                      <button class="btn btn-sm btn-success btn-approve" data-id="${p.id}"><i class="bi bi-check-lg"></i></button>
                      <button class="btn btn-sm btn-danger btn-reject" data-id="${p.id}"><i class="bi bi-x-lg"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div class="empty-state py-4"><p>Không có đơn đăng ký nào</p></div>'}
      </div>
    </div>
  `;
}

function bindPendingEvents() {
  document.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await API.approveMember(btn.dataset.id);
        Utils.showToast('Đã duyệt thành viên', 'success');
        Pages.manage(document.getElementById('appContent').firstElementChild || document.getElementById('appContent'));
      } catch (err) { /* handled */ }
    });
  });
  document.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Từ chối đơn đăng ký này?')) {
        try {
          await API.deleteMember(btn.dataset.id);
          Utils.showToast('Đã từ chối', 'info');
          Router.navigate('manage');
        } catch (err) { /* handled */ }
      }
    });
  });
}

function renderActivitiesTab(activities) {
  return `
    <div class="card">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Quản lý hoạt động</h5>
        <button class="btn btn-sm btn-primary" id="btnAddActivity"><i class="bi bi-plus-lg me-1"></i>Thêm</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr><th>Tên</th><th>Thời gian</th><th>Địa điểm</th><th>Tham gia</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              ${activities.map(a => {
                const st = a.status || Utils.getActivityStatus(a.startDate, a.endDate);
                return `<tr>
                  <td>${Utils.escapeHtml(a.name)}</td>
                  <td>${Utils.formatDate(a.startDate)} - ${Utils.formatDate(a.endDate)}</td>
                  <td>${Utils.escapeHtml(a.location || '')}</td>
                  <td>${a.participants || 0}</td>
                  <td><span class="badge ${Utils.statusClass(st)}">${Utils.statusLabel(st)}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAnnouncementsTab(announcements) {
  return `
    <div class="card">
      <div class="card-header bg-white"><h5 class="mb-0">Quản lý thông báo (${announcements.length})</h5></div>
      <div class="card-body">
        ${announcements.map(n => `
          <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
              ${n.pinned ? '<i class="bi bi-pin-angle text-warning me-1"></i>' : ''}
              <strong>${Utils.escapeHtml(n.title)}</strong>
              <small class="text-muted ms-2">${Utils.timeAgo(n.createdAt)}</small>
            </div>
            <div>
              <button class="btn btn-sm btn-outline-warning btn-pin" data-id="${n.id}"><i class="bi bi-pin"></i></button>
              <button class="btn btn-sm btn-outline-danger btn-delete-ann" data-id="${n.id}"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderScoresTab() {
  return `
    <div class="card">
      <div class="card-header bg-white"><h5 class="mb-0">Cộng điểm hoạt động</h5></div>
      <div class="card-body">
        <form id="addScoreForm" class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Mã thành viên</label>
            <input type="text" class="form-control" name="memberId" required>
          </div>
          <div class="col-md-4">
            <label class="form-label">Hoạt động</label>
            <input type="text" class="form-control" name="activity" required>
          </div>
          <div class="col-md-2">
            <label class="form-label">Điểm</label>
            <input type="number" class="form-control" name="score" min="1" required>
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button type="submit" class="btn btn-primary w-100">Cộng điểm</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderAttendanceTab() {
  return `
    <div class="card">
      <div class="card-header bg-white"><h5 class="mb-0">Điểm danh bằng QR</h5></div>
      <div class="card-body text-center py-5">
        <i class="bi bi-qr-code-scan text-primary" style="font-size:5rem"></i>
        <h5 class="mt-3">Quét mã QR thành viên</h5>
        <p class="text-muted">Sử dụng camera hoặc nhập mã thành viên để điểm danh</p>
        <div class="row justify-content-center mt-4">
          <div class="col-md-6">
            <div class="input-group">
              <input type="text" class="form-control" id="qrInput" placeholder="Nhập mã QR / MSSV">
              <button class="btn btn-primary" id="btnCheckIn"><i class="bi bi-check-lg me-1"></i>Điểm danh</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
