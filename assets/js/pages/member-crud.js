/**
 * Quản lý thành viên: thêm, sửa, xóa, khóa, reset MK
 */
const MemberCRUD = {
  modalId: 'memberFormModal',

  renderTable(members) {
    const rows = members.length ? members.map(m => `
      <tr>
        <td><code>${m.id}</code></td>
        <td>${Utils.escapeHtml(m.name)}</td>
        <td>${Utils.escapeHtml(m.email)}</td>
        <td><span class="badge bg-primary">${Utils.escapeHtml(m.role)}</span></td>
        <td>${Utils.escapeHtml(m.school || '—')}</td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-outline-primary btn-edit-member" data-id="${m.id}" title="Sửa"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-warning btn-reset-pw" data-id="${m.id}" title="Reset MK"><i class="bi bi-key"></i></button>
          <button class="btn btn-sm btn-outline-secondary btn-lock-member" data-id="${m.id}" title="Khóa"><i class="bi bi-lock"></i></button>
          <button class="btn btn-sm btn-outline-danger btn-delete-member" data-id="${m.id}" title="Xóa"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="6" class="text-center text-muted py-4">Chưa có thành viên</td></tr>`;

    return `
      <div class="card" data-member-crud>
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Quản lý thành viên (${members.length})</h5>
          <div>
            <button class="btn btn-sm btn-outline-primary me-1" id="exportAllMembers"><i class="bi bi-download"></i> Xuất</button>
            <button class="btn btn-sm btn-primary" id="btnAddMember"><i class="bi bi-plus-lg"></i> Thêm</button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr><th>Mã</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trường</th><th>Thao tác</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  ensureModal() {
    if (document.getElementById(this.modalId)) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="${this.modalId}" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <form id="memberForm">
              <div class="modal-header">
                <h5 class="modal-title" id="memberModalTitle">Thêm thành viên</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <input type="hidden" id="memberId">
                <div class="text-center mb-3 d-none" id="memberAvatarSection">
                  <div class="avatar-upload-wrap">
                    <img id="memberAvatarPreview" src="" alt="" class="rounded-circle border" width="80" height="80" style="object-fit:cover">
                    <button type="button" class="btn btn-sm btn-primary avatar-change-btn" id="btnMemberAvatar" title="Đổi ảnh">
                      <i class="bi bi-camera"></i>
                    </button>
                  </div>
                  <div class="small text-muted mt-2">Ảnh đại diện thành viên</div>
                </div>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Họ và tên <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="name" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">MSSV</label>
                    <input type="text" class="form-control" name="mssv">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Email <span class="text-danger">*</span></label>
                    <input type="email" class="form-control" name="email" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Số điện thoại</label>
                    <input type="tel" class="form-control" name="phone">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Trường</label>
                    <input type="text" class="form-control" name="school">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Khoa</label>
                    <input type="text" class="form-control" name="faculty">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Lớp</label>
                    <input type="text" class="form-control" name="className">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Khóa</label>
                    <input type="text" class="form-control" name="cohort" placeholder="VD: K22">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Ngày tham gia CLB</label>
                    <input type="date" class="form-control" name="joinDate">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Danh hiệu</label>
                    <input type="text" class="form-control" name="titles" placeholder="VD: Thành viên tích cực">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Chức vụ CLB</label>
                    <input type="text" class="form-control" name="role" placeholder="VD: Thành viên, Ủy viên">
                  </div>
                  <div class="col-md-6" id="memberUserRoleGroup">
                    <label class="form-label">Quyền hệ thống</label>
                    <select class="form-select" name="userRole">
                      <option value="member">Thành viên</option>
                      <option value="executive">Ban Chủ nhiệm</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div class="col-md-6" id="memberPasswordGroup">
                    <label class="form-label">Mật khẩu</label>
                    <input type="password" class="form-control" name="password" placeholder="Mặc định: sv5t123">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Giới thiệu</label>
                    <textarea class="form-control" name="bio" rows="2"></textarea>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg me-1"></i>Lưu</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `);

    document.getElementById('memberForm').addEventListener('submit', (e) => this.handleSubmit(e));
    document.getElementById('btnMemberAvatar')?.addEventListener('click', () => this.handleAvatarChange());
  },

  bindEvents(container, reloadFn) {
    this.ensureModal();
    this._reloadFn = reloadFn;
    this._activeContainer = container;
    this.initDelegation();
  },

  initDelegation() {
    if (this._delegationReady) return;
    this._delegationReady = true;

    document.addEventListener('click', async (e) => {
      const panel = e.target.closest('[data-member-crud]');
      if (!panel) return;

      if (e.target.closest('#btnAddMember')) {
        e.preventDefault();
        this.openAdd();
        return;
      }

      if (e.target.closest('#exportAllMembers')) {
        e.preventDefault();
        const members = await API.getMembers();
        await Utils.exportToExcel(members.map(m => ({
          id: m.id,
          name: m.name,
          mssv: m.mssv || '',
          email: m.email || '',
          phone: m.phone || '',
          role: m.role || '',
          school: m.school || '',
          faculty: m.faculty || '',
          cohort: m.cohort || ''
        })), 'thanh-vien-sv5t.xlsx', {
          sheetName: 'Thành viên',
          title: 'Danh sách thành viên CLB SV5T',
          columns: [
            { header: 'Mã', key: 'id' },
            { header: 'Họ tên', key: 'name' },
            { header: 'MSSV', key: 'mssv' },
            { header: 'Email', key: 'email' },
            { header: 'SĐT', key: 'phone' },
            { header: 'Vai trò', key: 'role' },
            { header: 'Trường', key: 'school' },
            { header: 'Khoa', key: 'faculty' },
            { header: 'Khóa', key: 'cohort' }
          ]
        });
        Utils.showToast('Đã xuất file', 'success');
        return;
      }

      const editBtn = e.target.closest('.btn-edit-member');
      if (editBtn) {
        e.preventDefault();
        this.openEdit(editBtn.dataset.id);
        return;
      }

      const resetBtn = e.target.closest('.btn-reset-pw');
      if (resetBtn) {
        e.preventDefault();
        if (!confirm('Reset mật khẩu thành viên này?')) return;
        try {
          await API.resetPassword(resetBtn.dataset.id);
          Utils.showToast('Đã reset mật khẩu', 'success');
        } catch (err) { /* handled */ }
        return;
      }

      const lockBtn = e.target.closest('.btn-lock-member');
      if (lockBtn) {
        e.preventDefault();
        if (!confirm('Khóa tài khoản thành viên này?')) return;
        try {
          await API.lockMember(lockBtn.dataset.id);
          Utils.showToast('Đã khóa tài khoản', 'warning');
          if (this._reloadFn) await this._reloadFn();
        } catch (err) { /* handled */ }
        return;
      }

      const deleteBtn = e.target.closest('.btn-delete-member');
      if (deleteBtn) {
        e.preventDefault();
        this.handleDelete(deleteBtn.dataset.id);
      }
    });
  },

  openAdd() {
    const form = document.getElementById('memberForm');
    form.reset();
    document.getElementById('memberId').value = '';
    document.getElementById('memberModalTitle').textContent = 'Thêm thành viên';
    document.getElementById('memberPasswordGroup').classList.remove('d-none');
    document.getElementById('memberUserRoleGroup').classList.remove('d-none');
    document.getElementById('memberAvatarSection')?.classList.add('d-none');
    new bootstrap.Modal(document.getElementById(this.modalId)).show();
  },

  async handleAvatarChange() {
    const id = document.getElementById('memberId').value;
    if (!id) return;
    try {
      await Utils.uploadMemberAvatar(id, (result) => {
        const preview = document.getElementById('memberAvatarPreview');
        if (preview) preview.src = result.url;
        Utils.showToast('Đã cập nhật ảnh đại diện', 'success');
      });
    } catch (err) { /* handled */ }
  },

  async openEdit(id) {
    try {
      const member = await API.getMember(id);
      const form = document.getElementById('memberForm');
      form.reset();
      document.getElementById('memberId').value = id;
      document.getElementById('memberModalTitle').textContent = 'Sửa thành viên';
      document.getElementById('memberPasswordGroup').classList.add('d-none');
      document.getElementById('memberUserRoleGroup').classList.add('d-none');

      ['name', 'mssv', 'email', 'phone', 'school', 'faculty', 'className', 'cohort', 'role', 'bio', 'titles'].forEach(field => {
        const el = form.elements[field];
        if (el) el.value = member[field] || '';
      });
      const joinDateEl = form.elements.joinDate;
      if (joinDateEl) joinDateEl.value = Utils.toInputDate(member.joinDate);

      const avatarSection = document.getElementById('memberAvatarSection');
      const avatarPreview = document.getElementById('memberAvatarPreview');
      if (avatarSection && avatarPreview) {
        avatarSection.classList.remove('d-none');
        avatarPreview.src = Utils.avatarUrl(member.avatar, member.name);
      }

      new bootstrap.Modal(document.getElementById(this.modalId)).show();
    } catch (err) { /* handled */ }
  },

  async handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const id = document.getElementById('memberId').value;
    const data = Object.fromEntries(new FormData(form));

    if (!data.name?.trim() || !data.email?.trim()) {
      Utils.showToast('Vui lòng nhập họ tên và email', 'danger');
      return;
    }

    try {
      if (id) {
        await API.updateMember(id, data);
        Utils.showToast('Đã cập nhật thành viên', 'success');
      } else {
        await API.addMember(data);
        Utils.showToast('Đã thêm thành viên mới', 'success');
      }
      bootstrap.Modal.getInstance(document.getElementById(this.modalId))?.hide();
      if (this._reloadFn) await this._reloadFn();
    } catch (err) { /* handled */ }
  },

  async handleDelete(id) {
    const members = await API.getMembers();
    const member = members.find(m => m.id === id);
    const name = member ? member.name : id;
    if (!confirm(`Xóa thành viên "${name}"?\nTài khoản và dữ liệu liên quan sẽ bị xóa.`)) return;

    try {
      await API.deleteMember(id);
      Utils.showToast('Đã xóa thành viên', 'success');
      if (this._reloadFn) await this._reloadFn();
    } catch (err) { /* handled */ }
  },

  async loadInto(container) {
    const members = await API.getMembers();
    container.innerHTML = this.renderTable(members);
    this.bindEvents(container, () => this.loadInto(container));
  }
};
