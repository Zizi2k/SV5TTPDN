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

  container.querySelectorAll('.activity-cover').forEach(img => {
    const actId = img.dataset.activityId;
    const activity = activities.find(a => a.id === actId);
    if (activity) Utils.renderActivityCover(img, activity);
  });
};

function renderActivityCoverHtml(activity, status) {
  const opacity = status === 'completed' ? 'opacity:0.85' : '';
  return `<img data-activity-id="${activity.id}" class="card-img-top activity-cover" style="${opacity}" alt="">`;
}

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
                ${renderActivityCoverHtml(a, status)}
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

Pages.checkin = async function(container, params) {
  const { activityId, code } = params;

  if (!activityId || !code) {
    container.innerHTML = `
      <div class="container py-5 text-center">
        <p class="text-danger">Mã điểm danh không hợp lệ</p>
        <a href="#activities" class="btn btn-primary">Về danh sách hoạt động</a>
      </div>`;
    return;
  }

  if (!Auth.isLoggedIn()) {
    sessionStorage.setItem('post_login_hash', `checkin/${activityId}/${code}`);
    Utils.showToast('Vui lòng đăng nhập để điểm danh', 'warning');
    Router.go('login');
    return;
  }

  container.innerHTML = `
    <div class="container py-5 text-center">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <p class="lead">Đang xử lý điểm danh...</p>
    </div>`;

  try {
    await API.memberCheckIn(activityId, { method: 'qr', checkInCode: code });
    AppStore.invalidateMany(['getActivities', 'getActivity']);
    Utils.showToast('Điểm danh thành công!', 'success');
    Router.go(`activities/${activityId}`);
  } catch (err) {
    container.innerHTML = `
      <div class="container py-5 text-center page-enter">
        <i class="bi bi-exclamation-circle text-danger display-4 mb-3"></i>
        <h4>Không thể điểm danh</h4>
        <p class="text-muted">${Utils.escapeHtml(err.message || 'Vui lòng thử lại')}</p>
        <a href="#activities/${activityId}" class="btn btn-primary me-2">Xem hoạt động</a>
        <a href="#activities" class="btn btn-outline-secondary">Danh sách hoạt động</a>
      </div>`;
  }
};

Pages.activityDetail = async function(container, id) {
  const activities = await API.getActivities();
  const activity = activities.find(a => a.id === id) || activities[0];
  const status = activity.status || Utils.getActivityStatus(activity.startDate, activity.endDate);

  let checkInInfo = null;
  if (Auth.isLoggedIn() && status === 'ongoing') {
    try {
      checkInInfo = await API.getActivityCheckInInfo(id);
    } catch { checkInInfo = null; }
  }

  const isRegistered = checkInInfo && (checkInInfo.isRegistered || checkInInfo.registered);
  const hasCheckedIn = checkInInfo && (checkInInfo.hasCheckedIn || checkInInfo.alreadyCheckedIn);
  const showCheckIn = isRegistered && !hasCheckedIn && status === 'ongoing';
  const showQr = checkInInfo && checkInInfo.checkInCode && (checkInInfo.canSeeQr || checkInInfo.qrVisible || checkInInfo.isAdmin);
  const alreadyCheckedIn = hasCheckedIn;
  const coverSrc = Utils.activityImageUrl(activity.image, activity.name);

  container.innerHTML = `
    <div class="container py-4">
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="#activities">Hoạt động</a></li>
          <li class="breadcrumb-item active">${Utils.escapeHtml(activity.name)}</li>
        </ol>
      </nav>

      <div class="card">
        <img src="${coverSrc}" alt="${Utils.escapeHtml(activity.name)}" class="activity-detail-cover mb-0" id="activityDetailCover">
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

          ${alreadyCheckedIn ? `
            <div class="alert alert-success mt-4"><i class="bi bi-check-circle me-2"></i>Bạn đã điểm danh hoạt động này.</div>
          ` : ''}

          ${showCheckIn ? `
            <div class="card mt-4 border-success">
              <div class="card-header bg-success text-white"><i class="bi bi-qr-code me-2"></i>Điểm danh nhanh</div>
              <div class="card-body text-center">
                ${showQr ? `
                  <p class="text-muted small mb-3">Hướng camera vào mã QR tại sự kiện — điểm danh tự động khi quét thành công</p>
                  <div id="qrScannerWrap" class="mb-3"><div id="qrScanner" style="max-width:320px;margin:0 auto"></div></div>
                  <p class="small text-muted mb-0"><i class="bi bi-info-circle me-1"></i>Hoặc quét QR bằng camera điện thoại để mở link điểm danh trực tiếp</p>
                ` : `
                  <p class="text-muted">Admin chưa mở hiển thị QR. Bạn có thể gửi ảnh minh chứng bên dưới.</p>
                `}
                <hr>
                <button class="btn btn-outline-warning btn-sm" id="btnManualCheckIn"><i class="bi bi-image me-1"></i>Gửi ảnh minh chứng (dự phòng)</button>
                <input type="file" id="proofImageInput" accept="image/*" class="d-none">
              </div>
            </div>
          ` : ''}

          <div class="mt-4 d-flex gap-2 flex-wrap">
            ${status !== 'completed' && Auth.isMember() && !isRegistered ? `
              <button class="btn btn-primary" id="btnJoin"><i class="bi bi-person-plus me-2"></i>Tham gia</button>
            ` : ''}
            <a href="#activities" class="btn btn-outline-secondary"><i class="bi bi-arrow-left me-2"></i>Quay lại</a>
          </div>
        </div>
      </div>
    </div>
  `;

  Utils.bindImageFallback(document.getElementById('activityDetailCover'), Utils.defaultActivityImage(activity.name));

  document.getElementById('btnJoin')?.addEventListener('click', async () => {
    try {
      await API.joinActivity(id);
      Utils.showToast('Đã đăng ký tham gia hoạt động!', 'success');
      Pages.activityDetail(container, id);
    } catch (err) { /* handled */ }
  });

  document.getElementById('btnManualCheckIn')?.addEventListener('click', () => {
    document.getElementById('proofImageInput')?.click();
  });

  document.getElementById('proofImageInput')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Utils.showToast('Ảnh không quá 5MB', 'danger');
      return;
    }
    try {
      const base64 = await Utils.fileToBase64(file);
      const uploaded = await API.uploadAttendanceProof(base64, file.name, id);
      await API.memberCheckIn(id, { method: 'manual', proofBase64: base64, filename: file.name, proofImage: uploaded.url });
      Utils.showToast('Điểm danh thành công!', 'success');
      Pages.activityDetail(container, id);
    } catch (err) { /* handled */ }
    e.target.value = '';
  });

  if (showCheckIn && showQr && checkInInfo?.checkInCode) {
    startAutoCheckInScanner(id, () => Pages.activityDetail(container, id));
  }
};

let _activeQrScanner = null;

async function startAutoCheckInScanner(activityId, onSuccess) {
  const wrap = document.getElementById('qrScannerWrap');
  if (!wrap || typeof Html5Qrcode === 'undefined') return;

  if (_activeQrScanner) {
    try { await _activeQrScanner.stop(); } catch { /* ignore */ }
    _activeQrScanner = null;
  }

  const scanner = new Html5Qrcode('qrScanner');
  _activeQrScanner = scanner;
  let processing = false;

  const onScan = async (decoded) => {
    if (processing) return;
    const parsed = Utils.parseCheckInQrPayload(decoded);
    if (!parsed || parsed.activityId !== activityId) return;

    processing = true;
    try {
      await scanner.stop();
      _activeQrScanner = null;
      await API.memberCheckIn(activityId, {
        method: 'qr',
        checkInCode: parsed.checkInCode,
        qrPayload: decoded
      });
      Utils.showToast('Điểm danh thành công!', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      processing = false;
    }
  };

  try {
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScan,
      () => {}
    );
  } catch {
    wrap.innerHTML = '<p class="text-warning small">Không mở được camera. Hãy quét QR bằng camera điện thoại hoặc gửi ảnh minh chứng.</p>';
  }
}
