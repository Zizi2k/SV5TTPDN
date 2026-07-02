Pages.myProfile = async function(container) {
  const user = Auth.getUser();
  const memberId = user.memberId || user.id;
  const fetchers = [
    API.getMember(memberId),
    API.getScores(memberId)
  ];
  if (user.role === 'admin') fetchers.push(API.getSettings());
  const results = await Promise.all(fetchers);
  const member = results[0];
  const scores = results[1];
  const settings = user.role === 'admin' ? (results[2] || {}) : {};
  const clubLogoUrl = settings.club_logo || Utils.DEFAULT_CLUB_LOGO;

  container.innerHTML = `
    <div class="profile-header">
      <div class="container">
        <div class="avatar-upload-wrap">
          <img src="${Utils.avatarUrl(member.avatar, member.name)}" alt="" class="profile-avatar" id="profileAvatarImg">
          <button type="button" class="btn btn-warning avatar-change-btn" id="btnChangeAvatar" title="Đổi ảnh đại diện">
            <i class="bi bi-camera-fill"></i>
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-warning avatar-change-label mb-3" id="btnChangeAvatarLabel">
          <i class="bi bi-camera-fill me-1"></i>Đổi ảnh đại diện
        </button>
        <h2 class="mb-1">${Utils.escapeHtml(member.name)}</h2>
        <p class="lead mb-0">${Utils.escapeHtml(member.role)}</p>
      </div>
    </div>

    <div class="container" style="margin-top:-40px; position:relative; z-index:1">
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="profile-section">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="mb-0"><i class="bi bi-person me-2"></i>Thông tin cá nhân</h5>
              <button class="btn btn-sm btn-outline-primary" id="btnEditProfile"><i class="bi bi-pencil me-1"></i>Chỉnh sửa</button>
            </div>
            <div class="row g-3" id="profileInfo">
              <div class="col-md-6"><strong>Email:</strong> ${Utils.escapeHtml(member.email || '')}</div>
              <div class="col-md-6"><strong>Điện thoại:</strong> ${Utils.escapeHtml(member.phone || '—')}</div>
              <div class="col-md-6"><strong>Trường:</strong> ${Utils.escapeHtml(member.school || '—')}</div>
              <div class="col-md-6"><strong>Khoa:</strong> ${Utils.escapeHtml(member.faculty || '—')}</div>
              <div class="col-md-6"><strong>Ngày sinh:</strong> ${Utils.formatDate(member.birthday) || '—'}</div>
              <div class="col-md-6"><strong>Tham gia:</strong> ${Utils.formatDate(member.joinDate) || '—'}</div>
              <div class="col-md-6"><strong>Facebook:</strong> ${member.facebook ? `<a href="${Utils.escapeHtml(member.facebook)}" target="_blank">Liên kết</a>` : '—'}</div>
              <div class="col-md-6"><strong>Zalo:</strong> ${Utils.escapeHtml(member.zalo || '—')}</div>
              <div class="col-12"><strong>Địa chỉ:</strong> ${Utils.escapeHtml(member.address || '—')}</div>
            </div>
          </div>

          <div class="profile-section">
            <h5><i class="bi bi-chat-quote me-2"></i>Giới thiệu</h5>
            <p class="mb-2">${Utils.escapeHtml(member.bio || 'Chưa cập nhật')}</p>
            ${member.quote ? `<blockquote class="blockquote border-start border-warning border-4 ps-3 mb-0"><p class="mb-0 fst-italic small">"${Utils.escapeHtml(member.quote)}"</p></blockquote>` : ''}
          </div>

          ${member.hobbies ? `
            <div class="profile-section">
              <h5><i class="bi bi-heart me-2"></i>Sở thích</h5>
              <div>${Utils.tagsToHtml(Utils.parseTags(member.hobbies), 'tag tag-hobby')}</div>
            </div>
          ` : ''}

          ${member.skills ? `
            <div class="profile-section">
              <h5><i class="bi bi-tools me-2"></i>Kỹ năng</h5>
              <div>${Utils.tagsToHtml(Utils.parseTags(member.skills), 'tag tag-skill')}</div>
            </div>
          ` : ''}

          <div class="profile-section">
            <h5><i class="bi bi-trophy me-2"></i>Điểm hoạt động</h5>
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr><th>Hoạt động</th><th>Ngày</th><th class="text-end">Điểm</th></tr>
                </thead>
                <tbody>
                  ${(scores.items || []).length ? (scores.items || []).map(s => `
                    <tr>
                      <td>${Utils.escapeHtml(s.activity)}</td>
                      <td>${Utils.formatDate(s.date)}</td>
                      <td class="text-end fw-semibold">${s.score}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="3" class="text-center text-muted">Chưa có điểm</td></tr>'}
                </tbody>
                <tfoot>
                  <tr class="score-total">
                    <td colspan="2">Tổng</td>
                    <td class="text-end">${scores.total || 0}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="profile-section text-center">
            <h5><i class="bi bi-qr-code me-2"></i>Mã QR cá nhân</h5>
            <div class="bg-light rounded p-4 mb-3">
              <i class="bi bi-qr-code" style="font-size:8rem; color:var(--primary)"></i>
            </div>
            <p class="text-muted small">Quét mã QR để điểm danh hoạt động</p>
            <code class="small">${memberId}</code>
          </div>

          <div class="profile-section">
            <h5><i class="bi bi-award me-2"></i>Danh hiệu</h5>
            <p>${member.titles ? `<span class="badge bg-warning text-dark fs-6">${Utils.escapeHtml(member.titles)}</span>` : '<span class="text-muted">Chưa có danh hiệu</span>'}</p>
          </div>

          <div class="profile-section">
            <h5><i class="bi bi-shield-lock me-2"></i>Bảo mật</h5>
            <button class="btn btn-outline-secondary btn-sm w-100" id="btnChangePassword">
              <i class="bi bi-key me-1"></i>Đổi mật khẩu
            </button>
          </div>

          ${user.role === 'admin' ? `
          <div class="profile-section text-center">
            <h5><i class="bi bi-building me-2"></i>Logo CLB</h5>
            <img src="${Utils.escapeHtml(clubLogoUrl)}" alt="Logo CLB" class="club-logo-preview mb-3" id="profileClubLogoPreview">
            <button class="btn btn-primary btn-sm w-100" id="btnChangeClubLogoProfile">
              <i class="bi bi-image me-1"></i>Đổi logo CLB
            </button>
            <p class="text-muted small mt-2 mb-0">Hiển thị trên menu, chân trang và trang đăng nhập</p>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  ensureProfileModals();

  async function handleAvatarChange() {
    try {
      await Utils.uploadMemberAvatar(memberId, (result) => {
        const img = document.getElementById('profileAvatarImg');
        if (img) img.src = Utils.avatarUrl(result.url, member.name);
        Utils.showToast('Đã cập nhật ảnh đại diện', 'success');
      });
    } catch (err) { /* handled */ }
  }

  document.getElementById('btnEditProfile')?.addEventListener('click', () => openEditProfileModal(member));
  document.getElementById('btnChangeAvatar')?.addEventListener('click', handleAvatarChange);
  document.getElementById('btnChangeAvatarLabel')?.addEventListener('click', handleAvatarChange);
  document.getElementById('btnChangeClubLogoProfile')?.addEventListener('click', async () => {
    try {
      await Utils.uploadClubLogoFile((result) => {
        const preview = document.getElementById('profileClubLogoPreview');
        if (preview) preview.src = result.url;
        Utils.showToast('Đã cập nhật logo CLB', 'success');
      });
    } catch (err) { /* handled */ }
  });
  document.getElementById('btnChangePassword')?.addEventListener('click', () => {
    new bootstrap.Modal(document.getElementById('changePasswordModal')).show();
  });

  document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    try {
      await API.updateProfile(data);
      Utils.showToast('Đã cập nhật hồ sơ', 'success');
      bootstrap.Modal.getInstance(document.getElementById('editProfileModal'))?.hide();
      Pages.myProfile(container);
    } catch (err) { /* handled */ }
  });

  document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      Utils.showToast('Mật khẩu xác nhận không khớp', 'danger');
      return;
    }
    if (newPassword.length < 6) {
      Utils.showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'danger');
      return;
    }

    try {
      await API.changePassword({ currentPassword, newPassword });
      Utils.showToast('Đã đổi mật khẩu thành công', 'success');
      bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'))?.hide();
      form.reset();
    } catch (err) { /* handled */ }
  });
};

function ensureProfileModals() {
  if (document.getElementById('editProfileModal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal fade" id="editProfileModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <form id="editProfileForm">
            <div class="modal-header">
              <h5 class="modal-title">Chỉnh sửa hồ sơ</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Số điện thoại</label>
                  <input type="tel" class="form-control" name="phone">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Địa chỉ</label>
                  <input type="text" class="form-control" name="address">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Facebook</label>
                  <input type="url" class="form-control" name="facebook" placeholder="https://facebook.com/...">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Zalo</label>
                  <input type="text" class="form-control" name="zalo">
                </div>
                <div class="col-12">
                  <label class="form-label">Sở thích</label>
                  <input type="text" class="form-control" name="hobbies" placeholder="VD: Đọc sách, Bóng đá (phân cách bằng dấu phẩy)">
                </div>
                <div class="col-12">
                  <label class="form-label">Kỹ năng</label>
                  <input type="text" class="form-control" name="skills" placeholder="VD: MC, Thiết kế, Lập trình">
                </div>
                <div class="col-12">
                  <label class="form-label">Câu nói yêu thích</label>
                  <input type="text" class="form-control" name="quote">
                </div>
                <div class="col-12">
                  <label class="form-label">Giới thiệu bản thân</label>
                  <textarea class="form-control" name="bio" rows="3"></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
              <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="modal fade" id="changePasswordModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="changePasswordForm">
            <div class="modal-header">
              <h5 class="modal-title">Đổi mật khẩu</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Mật khẩu hiện tại</label>
                <input type="password" class="form-control" name="currentPassword" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Mật khẩu mới</label>
                <input type="password" class="form-control" name="newPassword" required minlength="6">
              </div>
              <div class="mb-3">
                <label class="form-label">Xác nhận mật khẩu mới</label>
                <input type="password" class="form-control" name="confirmPassword" required minlength="6">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
              <button type="submit" class="btn btn-primary">Đổi mật khẩu</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `);
}

function openEditProfileModal(member) {
  const form = document.getElementById('editProfileForm');
  if (!form) return;
  form.reset();
  ['phone', 'address', 'facebook', 'zalo', 'hobbies', 'skills', 'quote', 'bio'].forEach(field => {
    const el = form.elements[field];
    if (el) el.value = member[field] || '';
  });
  new bootstrap.Modal(document.getElementById('editProfileModal')).show();
}
