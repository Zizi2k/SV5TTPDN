/**
 * Quản lý hoạt động: thêm, sửa, xóa (dùng chung Admin & Quản lý)
 */
const ActivityCRUD = {
  modalId: 'activityFormModal',

  renderTable(activities) {
    const rows = activities.length ? activities.map(a => {
      const st = a.status || Utils.getActivityStatus(a.startDate, a.endDate);
      return `
        <tr>
          <td>${Utils.escapeHtml(a.name)}</td>
          <td>${Utils.formatDate(a.startDate)} – ${Utils.formatDate(a.endDate)}</td>
          <td>${Utils.escapeHtml(a.location || '—')}</td>
          <td>${a.participants || 0}</td>
          <td><span class="badge ${Utils.statusClass(st)}">${Utils.statusLabel(st)}</span></td>
          <td class="text-nowrap">
            <button class="btn btn-sm btn-outline-primary btn-edit-activity" data-id="${a.id}" title="Sửa">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger btn-delete-activity" data-id="${a.id}" title="Xóa">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('') : `<tr><td colspan="6" class="text-center text-muted py-4">Chưa có hoạt động nào</td></tr>`;

    return `
      <div class="card activity-crud-panel" data-activity-crud>
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Quản lý hoạt động (${activities.length})</h5>
          <button class="btn btn-sm btn-primary" id="btnAddActivity">
            <i class="bi bi-plus-lg me-1"></i>Thêm hoạt động
          </button>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Tên</th>
                  <th>Thời gian</th>
                  <th>Địa điểm</th>
                  <th>Tham gia</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
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
            <form id="activityForm">
              <div class="modal-header">
                <h5 class="modal-title" id="activityModalTitle">Thêm hoạt động</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <input type="hidden" name="id" id="activityId">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Tên hoạt động <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="name" id="activityName" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Ngày bắt đầu <span class="text-danger">*</span></label>
                    <input type="date" class="form-control" name="startDate" id="activityStartDate" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Ngày kết thúc <span class="text-danger">*</span></label>
                    <input type="date" class="form-control" name="endDate" id="activityEndDate" required>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Địa điểm</label>
                    <input type="text" class="form-control" name="location" id="activityLocation" placeholder="VD: Trường ĐH Công nghệ, Biên Hòa">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Mô tả</label>
                    <textarea class="form-control" name="description" id="activityDescription" rows="3"></textarea>
                  </div>
                  <div class="col-12" id="activityReportGroup">
                    <label class="form-label">Báo cáo (hoạt động đã kết thúc)</label>
                    <textarea class="form-control" name="report" id="activityReport" rows="3" placeholder="Tóm tắt kết quả hoạt động..."></textarea>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                <button type="submit" class="btn btn-primary" id="activitySubmitBtn">
                  <i class="bi bi-check-lg me-1"></i>Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `);

    document.getElementById('activityForm').addEventListener('submit', (e) => this.handleSubmit(e));
  },

  bindEvents(container, reloadFn) {
    this.ensureModal();
    this._reloadFn = reloadFn;
    this.initDelegation();
  },

  initDelegation() {
    if (this._delegationReady) return;
    this._delegationReady = true;

    document.addEventListener('click', (e) => {
      const panel = e.target.closest('[data-activity-crud]');
      if (!panel) return;

      if (e.target.closest('#btnAddActivity')) {
        e.preventDefault();
        this.openAdd();
        return;
      }

      const editBtn = e.target.closest('.btn-edit-activity');
      if (editBtn) {
        e.preventDefault();
        this.openEdit(editBtn.dataset.id);
        return;
      }

      const deleteBtn = e.target.closest('.btn-delete-activity');
      if (deleteBtn) {
        e.preventDefault();
        this.handleDelete(deleteBtn.dataset.id);
      }
    });
  },

  openAdd() {
    const form = document.getElementById('activityForm');
    form.reset();
    document.getElementById('activityId').value = '';
    document.getElementById('activityModalTitle').textContent = 'Thêm hoạt động';
    document.getElementById('activityReportGroup').classList.add('d-none');
    new bootstrap.Modal(document.getElementById(this.modalId)).show();
  },

  async openEdit(id) {
    try {
      const activities = await API.getActivities();
      const activity = activities.find(a => a.id === id);
      if (!activity) {
        Utils.showToast('Không tìm thấy hoạt động', 'danger');
        return;
      }

      document.getElementById('activityId').value = activity.id;
      document.getElementById('activityName').value = activity.name || '';
      document.getElementById('activityStartDate').value = (activity.startDate || '').split('T')[0];
      document.getElementById('activityEndDate').value = (activity.endDate || '').split('T')[0];
      document.getElementById('activityLocation').value = activity.location || '';
      document.getElementById('activityDescription').value = activity.description || '';
      document.getElementById('activityReport').value = activity.report || '';
      document.getElementById('activityModalTitle').textContent = 'Sửa hoạt động';

      const st = activity.status || Utils.getActivityStatus(activity.startDate, activity.endDate);
      document.getElementById('activityReportGroup').classList.toggle('d-none', st !== 'completed');

      new bootstrap.Modal(document.getElementById(this.modalId)).show();
    } catch (err) { /* handled by API */ }
  },

  async handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const id = document.getElementById('activityId').value;
    const startDate = form.startDate.value;
    const endDate = form.endDate.value;

    if (endDate < startDate) {
      Utils.showToast('Ngày kết thúc phải sau ngày bắt đầu', 'danger');
      return;
    }

    const data = {
      name: form.name.value.trim(),
      startDate,
      endDate,
      location: form.location.value.trim(),
      description: form.description.value.trim(),
      report: form.report.value.trim()
    };

    const submitBtn = document.getElementById('activitySubmitBtn');
    submitBtn.disabled = true;

    try {
      if (id) {
        await API.updateActivity(id, data);
        Utils.showToast('Đã cập nhật hoạt động', 'success');
      } else {
        await API.addActivity(data);
        Utils.showToast('Đã thêm hoạt động mới', 'success');
      }

      bootstrap.Modal.getInstance(document.getElementById(this.modalId))?.hide();
      if (this._reloadFn) await this._reloadFn();
    } catch (err) { /* handled */ }
    finally {
      submitBtn.disabled = false;
    }
  },

  async handleDelete(id) {
    const activities = await API.getActivities();
    const activity = activities.find(a => a.id === id);
    const name = activity ? activity.name : id;
    if (!confirm(`Xóa hoạt động "${name}"?\nHành động này không thể hoàn tác.`)) return;

    try {
      await API.deleteActivity(id);
      Utils.showToast('Đã xóa hoạt động', 'success');
      if (this._reloadFn) await this._reloadFn();
    } catch (err) { /* handled */ }
  },

  async loadInto(container) {
    const activities = await API.getActivities();
    container.innerHTML = this.renderTable(activities);
    this.bindEvents(container, () => this.loadInto(container));
  }
};
