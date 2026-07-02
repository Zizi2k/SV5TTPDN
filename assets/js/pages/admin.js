Pages.admin = async function(container) {
  const [dashboard, members, pending] = await Promise.all([
    API.getDashboard(),
    API.getMembers(),
    API.getPendingMembers()
  ]);

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
              <a class="nav-link" href="#" data-tab="settings"><i class="bi bi-gear me-2"></i>Cài đặt</a>
              <a class="nav-link" href="#" data-tab="audit"><i class="bi bi-journal-text me-2"></i>Nhật ký</a>
            </nav>
          </div>
        </div>
        <div class="col-lg-9">
          <div id="adminContent">${renderAdminMembers(members)}</div>
        </div>
      </div>
    </div>
  `;

  const data = { members, pending };

  document.getElementById('adminNav').addEventListener('click', async (e) => {
    const link = e.target.closest('[data-tab]');
    if (!link) return;
    e.preventDefault();
    document.querySelectorAll('#adminNav .nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const content = document.getElementById('adminContent');
    switch (link.dataset.tab) {
      case 'members': content.innerHTML = renderAdminMembers(data.members); bindAdminMemberEvents(); break;
      case 'pending': content.innerHTML = renderAdminPending(data.pending); bindAdminPendingEvents(); break;
      case 'activities':
        await ActivityCRUD.loadInto(content);
        break;
      case 'announcements': content.innerHTML = await renderAdminAnnouncements(); break;
      case 'executive': content.innerHTML = await renderAdminExecutive(); break;
      case 'settings': content.innerHTML = renderAdminSettings(); break;
      case 'audit': content.innerHTML = await renderAdminAudit(); break;
    }
  });

  bindAdminMemberEvents();
};

function renderAdminMembers(members) {
  return `
    <div class="card">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Quản lý thành viên (${members.length})</h5>
        <div>
          <button class="btn btn-sm btn-outline-primary me-1" id="exportAll"><i class="bi bi-download"></i> Xuất</button>
          <button class="btn btn-sm btn-primary" id="btnAddMember"><i class="bi bi-plus-lg"></i> Thêm</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr><th>Mã</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trường</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              ${members.map(m => `
                <tr>
                  <td><code>${m.id}</code></td>
                  <td>${Utils.escapeHtml(m.name)}</td>
                  <td>${Utils.escapeHtml(m.email)}</td>
                  <td><span class="badge bg-primary">${Utils.escapeHtml(m.role)}</span></td>
                  <td>${Utils.escapeHtml(m.school || '')}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary btn-edit-member" data-id="${m.id}" title="Sửa"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-warning btn-reset-pw" data-id="${m.id}" title="Reset MK"><i class="bi bi-key"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-lock-member" data-id="${m.id}" title="Khóa"><i class="bi bi-lock"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function bindAdminMemberEvents() {
  document.getElementById('exportAll')?.addEventListener('click', async () => {
    const members = await API.getMembers();
    Utils.exportToCSV(members, 'thanh-vien-sv5t.csv');
    Utils.showToast('Đã xuất file', 'success');
  });

  document.querySelectorAll('.btn-reset-pw').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Reset mật khẩu thành viên này?')) {
        try {
          await API.resetPassword(btn.dataset.id);
          Utils.showToast('Đã reset mật khẩu', 'success');
        } catch (err) { /* handled */ }
      }
    });
  });

  document.querySelectorAll('.btn-lock-member').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Khóa tài khoản thành viên này?')) {
        try {
          await API.lockMember(btn.dataset.id);
          Utils.showToast('Đã khóa tài khoản', 'warning');
        } catch (err) { /* handled */ }
      }
    });
  });
}

function renderAdminPending(pending) {
  return `
    <div class="card">
      <div class="card-header bg-white"><h5 class="mb-0">Duyệt tài khoản (${pending.length})</h5></div>
      <div class="card-body p-0">
        ${pending.length ? `
          <table class="table table-hover mb-0">
            <thead class="table-light"><tr><th>Họ tên</th><th>MSSV</th><th>Email</th><th>Trường</th><th></th></tr></thead>
            <tbody>
              ${pending.map(p => `
                <tr>
                  <td>${Utils.escapeHtml(p.name)}</td>
                  <td>${Utils.escapeHtml(p.mssv)}</td>
                  <td>${Utils.escapeHtml(p.email)}</td>
                  <td>${Utils.escapeHtml(p.school)}</td>
                  <td>
                    <button class="btn btn-sm btn-success admin-approve" data-id="${p.id}">Duyệt</button>
                    <button class="btn btn-sm btn-danger admin-reject" data-id="${p.id}">Từ chối</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state py-4"><p>Không có đơn chờ duyệt</p></div>'}
      </div>
    </div>
  `;
}

function bindAdminPendingEvents() {
  document.querySelectorAll('.admin-approve').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await API.approveMember(btn.dataset.id);
        Utils.showToast('Đã duyệt', 'success');
        Router.navigate('admin');
      } catch (err) { /* handled */ }
    });
  });
}

async function renderAdminAnnouncements() {
  const items = await API.getAnnouncements();
  return `<div class="card"><div class="card-header bg-white"><h5 class="mb-0">Thông báo (${items.length})</h5></div>
    <div class="card-body">${items.map(n => `<div class="border-bottom py-2">${n.pinned ? '📌 ' : ''}<strong>${Utils.escapeHtml(n.title)}</strong></div>`).join('')}</div></div>`;
}

async function renderAdminExecutive() {
  const board = await API.getExecutiveBoard();
  return `<div class="card"><div class="card-header bg-white"><h5 class="mb-0">Ban Chủ nhiệm (${board.length})</h5></div>
    <div class="card-body"><div class="row g-3">${board.map(m => `
      <div class="col-md-4"><div class="border rounded p-3 text-center">
        <strong>${Utils.escapeHtml(m.name)}</strong><br><small class="text-primary">${Utils.escapeHtml(m.position)}</small>
      </div></div>`).join('')}</div></div></div>`;
}

function renderAdminSettings() {
  return `
    <div class="card">
      <div class="card-header bg-white"><h5 class="mb-0">Cài đặt hệ thống</h5></div>
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Tên CLB</label>
          <input type="text" class="form-control" value="${CONFIG.CLUB_NAME}">
        </div>
        <div class="mb-3">
          <label class="form-label">Email liên hệ</label>
          <input type="email" class="form-control" value="clbsv5t.dongnai@gmail.com">
        </div>
        <button class="btn btn-primary">Lưu cài đặt</button>
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
        ${logs.length ? logs.map(l => `<div class="border-bottom py-2 small"><strong>${l.action}</strong> - ${l.user} - ${Utils.formatDateTime(l.timestamp)}</div>`).join('') :
          '<p class="text-muted">Chưa có nhật ký (sẽ ghi lại khi kết nối API)</p>'}
      </div>
    </div>
  `;
}
