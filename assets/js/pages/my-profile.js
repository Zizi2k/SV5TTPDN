Pages.myProfile = async function(container) {
  const user = Auth.getUser();
  const memberId = user.memberId || user.id;
  const [member, scores] = await Promise.all([
    API.getMember(memberId),
    API.getScores(memberId)
  ]);

  container.innerHTML = `
    <div class="profile-header">
      <div class="container">
        <img src="${Utils.avatarUrl(member.avatar, member.name)}" alt="" class="profile-avatar">
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
              <div class="col-md-6"><strong>Điện thoại:</strong> ${Utils.escapeHtml(member.phone || '')}</div>
              <div class="col-md-6"><strong>Trường:</strong> ${Utils.escapeHtml(member.school || '')}</div>
              <div class="col-md-6"><strong>Khoa:</strong> ${Utils.escapeHtml(member.faculty || '')}</div>
              <div class="col-md-6"><strong>Ngày sinh:</strong> ${Utils.formatDate(member.birthday)}</div>
              <div class="col-md-6"><strong>Tham gia:</strong> ${Utils.formatDate(member.joinDate)}</div>
            </div>
          </div>

          <div class="profile-section">
            <h5><i class="bi bi-trophy me-2"></i>Điểm hoạt động</h5>
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr><th>Hoạt động</th><th>Ngày</th><th class="text-end">Điểm</th></tr>
                </thead>
                <tbody>
                  ${(scores.items || []).map(s => `
                    <tr>
                      <td>${Utils.escapeHtml(s.activity)}</td>
                      <td>${Utils.formatDate(s.date)}</td>
                      <td class="text-end fw-semibold">${s.score}</td>
                    </tr>
                  `).join('')}
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
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnEditProfile')?.addEventListener('click', () => {
    Utils.showToast('Tính năng chỉnh sửa hồ sơ sẽ được cập nhật', 'info');
  });

  document.getElementById('btnChangePassword')?.addEventListener('click', () => {
    Utils.showToast('Tính năng đổi mật khẩu sẽ được cập nhật', 'info');
  });
};
