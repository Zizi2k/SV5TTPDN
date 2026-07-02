Pages.announcements = async function(container) {
  const announcements = await API.getAnnouncements();
  announcements.sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  container.innerHTML = `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="section-title mb-0">Thông báo</h2>
        ${Auth.isExecutive() ? `<button class="btn btn-primary" id="btnNewAnnouncement"><i class="bi bi-plus-lg me-1"></i>Đăng thông báo</button>` : ''}
      </div>

      <div id="announcementFeed">
        ${announcements.length ? announcements.map(n => renderAnnouncement(n)).join('') : `
          <div class="empty-state">
            <i class="bi bi-bell"></i>
            <p>Chưa có thông báo nào</p>
          </div>
        `}
      </div>
    </div>

    ${Auth.isExecutive() ? renderAnnouncementModal() : ''}
  `;

  document.getElementById('btnNewAnnouncement')?.addEventListener('click', () => {
    new bootstrap.Modal(document.getElementById('announcementModal')).show();
  });

  document.getElementById('announcementForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      content: form.content.value,
      important: form.important.checked,
      pinned: form.pinned.checked
    };
    try {
      await API.addAnnouncement(data);
      Utils.showToast('Đã đăng thông báo', 'success');
      bootstrap.Modal.getInstance(document.getElementById('announcementModal')).hide();
      Pages.announcements(container);
    } catch (err) { /* handled */ }
  });
};

function renderAnnouncement(n) {
  return `
    <div class="announcement-item ${n.pinned ? 'pinned' : ''}">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          ${n.pinned ? '<span class="badge bg-warning text-dark me-1"><i class="bi bi-pin-angle"></i> Ghim</span>' : ''}
          ${n.important ? '<span class="badge bg-danger me-1"><i class="bi bi-exclamation-circle"></i> Quan trọng</span>' : ''}
          <h5 class="mb-2 mt-1">${Utils.escapeHtml(n.title)}</h5>
        </div>
        <span class="time text-nowrap ms-3">${Utils.timeAgo(n.createdAt)}</span>
      </div>
      <p class="mb-2">${Utils.escapeHtml(n.content)}</p>
      <small class="text-muted"><i class="bi bi-person me-1"></i>${Utils.escapeHtml(n.author || 'Ban Chủ nhiệm')}</small>
    </div>
  `;
}

function renderAnnouncementModal() {
  return `
    <div class="modal fade" id="announcementModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="announcementForm">
            <div class="modal-header">
              <h5 class="modal-title">Đăng thông báo mới</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Tiêu đề</label>
                <input type="text" class="form-control" name="title" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Nội dung</label>
                <textarea class="form-control" name="content" rows="5" required></textarea>
              </div>
              <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" name="important" id="annImportant">
                <label class="form-check-label" for="annImportant">Đánh dấu quan trọng</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" name="pinned" id="annPinned">
                <label class="form-check-label" for="annPinned">Ghim thông báo</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
              <button type="submit" class="btn btn-primary">Đăng</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}
