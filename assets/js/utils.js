/**
 * Tiện ích dùng chung
 */
const Utils = {
  showLoading(show = true) {
    document.getElementById('loadingOverlay').classList.toggle('d-none', !show);
  },

  showPageSkeleton(container) {
    container.innerHTML = `
      <div class="page-skeleton page-enter">
        <div class="container py-4">
          <div class="placeholder-glow mb-4">
            <span class="placeholder rounded" style="display:block;width:40%;height:2rem"></span>
          </div>
          <div class="row g-3 mb-4">
            ${[1,2,3,4].map(() => `
              <div class="col-6 col-md-3">
                <div class="card p-3 placeholder-glow">
                  <span class="placeholder col-8 rounded mb-2" style="height:0.8rem"></span>
                  <span class="placeholder col-5 rounded" style="height:1.8rem"></span>
                </div>
              </div>`).join('')}
          </div>
          <div class="card p-4 placeholder-glow">
            <span class="placeholder col-12 rounded mb-3" style="height:2.5rem"></span>
            <span class="placeholder col-12 rounded mb-3" style="height:2.5rem"></span>
            <span class="placeholder col-10 rounded" style="height:2.5rem"></span>
          </div>
        </div>
      </div>`;
    return container.firstElementChild;
  },

  showToast(message, type = 'info') {
    const icons = { success: 'check-circle', danger: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    const container = document.getElementById('toastContainer');
    const id = 'toast-' + Date.now();
    container.insertAdjacentHTML('beforeend', `
      <div id="${id}" class="toast align-items-center text-bg-${type} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body"><i class="bi bi-${icons[type] || 'info-circle'} me-2"></i>${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `);
    const toast = new bootstrap.Toast(document.getElementById(id), { delay: 4000 });
    toast.show();
    document.getElementById(id).addEventListener('hidden.bs.toast', () => document.getElementById(id).remove());
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  toInputDate(dateStr) {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const vi = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (vi) return `${vi[3]}-${vi[2]}-${vi[1]}`;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return '';
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
    if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
    if (diff < 604800) return Math.floor(diff / 86400) + ' ngày trước';
    return this.formatDate(dateStr);
  },

  daysRemaining(endDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  },

  daysUntil(startDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    return Math.ceil((start - now) / (1000 * 60 * 60 * 24));
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  parseTags(str) {
    if (!str) return [];
    return str.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  },

  tagsToHtml(tags, className = 'tag') {
    return tags.map(t => `<span class="${className}">${this.escapeHtml(t)}</span>`).join('');
  },

  defaultAvatar(name) {
    const initial = (name || '?').charAt(0).toUpperCase();
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#2563EB" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40" font-family="Arial">${initial}</text></svg>`)}`;
  },

  avatarUrl(url, name) {
    return this.normalizeImageUrl(url) || this.defaultAvatar(name);
  },

  DEFAULT_CLUB_LOGO: 'assets/img/logo.svg',

  extractDriveFileId(value) {
    if (!value) return '';
    const str = String(value);
    if (!str.includes('http') && !str.includes('/')) return str;
    const match = str.match(/[-\w]{25,}/);
    return match ? match[0] : '';
  },

  resolveAsset(path) {
    try {
      return new URL(path, document.baseURI).href;
    } catch {
      return path;
    }
  },

  normalizeImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    const driveId = this.extractDriveFileId(trimmed);
    if (driveId) {
      return `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
    }

    if (/^(https?:|data:)/i.test(trimmed)) return trimmed;
    return this.resolveAsset(trimmed);
  },

  clubLogoUrl(url) {
    return this.normalizeImageUrl(url) || this.resolveAsset(this.DEFAULT_CLUB_LOGO);
  },

  bindImageFallback(img, fallbackUrl) {
    if (!img) return;
    const fallback = fallbackUrl || this.resolveAsset(this.DEFAULT_CLUB_LOGO);
    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = '1';
      img.src = fallback;
    }, { once: true });
  },

  applyClubLogos(url) {
    const src = this.clubLogoUrl(url);
    document.querySelectorAll('.club-logo').forEach(img => {
      img.src = src;
      this.bindImageFallback(img);
    });
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && url) favicon.href = src;
    try {
      if (url && url.trim()) localStorage.setItem('club_logo', url.trim());
      else localStorage.removeItem('club_logo');
    } catch { /* ignore */ }
  },

  async loadClubBranding() {
    try {
      const settings = await API.getSettings();
      const url = (settings?.club_logo || '').trim();
      this.applyClubLogos(url);
    } catch {
      const cached = (localStorage.getItem('club_logo') || '').trim();
      this.applyClubLogos(cached);
    }
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async pickImageFile(maxMb = 5) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        if (file.size > maxMb * 1024 * 1024) {
          this.showToast(`Ảnh không được quá ${maxMb}MB`, 'danger');
          resolve(null);
          return;
        }
        resolve(file);
      };
      input.click();
    });
  },

  async uploadMemberAvatar(memberId, onSuccess) {
    const file = await this.pickImageFile();
    if (!file) return null;
    const base64 = await this.fileToBase64(file);
    const result = await API.uploadAvatar(base64, file.name, memberId);
    if (onSuccess) onSuccess(result);
    return result;
  },

  async uploadClubLogoFile(onSuccess) {
    const file = await this.pickImageFile();
    if (!file) return null;
    const base64 = await this.fileToBase64(file);
    const result = await API.uploadClubLogo(base64, file.name);
    this.applyClubLogos(result.url);
    if (onSuccess) onSuccess(result);
    return result;
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePhone(phone) {
    return /^(0|\+84)[0-9]{9,10}$/.test(phone.replace(/\s/g, ''));
  },

  getActivityStatus(startDate, endDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (now > end) return 'completed';
    if (now >= start) return 'ongoing';
    return 'upcoming';
  },

  statusLabel(status) {
    const labels = {
      ongoing: 'Đang diễn ra',
      upcoming: 'Sắp diễn ra',
      completed: 'Đã kết thúc'
    };
    return labels[status] || status;
  },

  statusClass(status) {
    return `status-${status}`;
  },

  exportToCSV(data, filename) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row =>
      headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  },

  parseCheckInQrPayload(text) {
    if (!text) return null;
    const m = String(text).match(/^SV5TTPDN:CHECKIN:([^:]+):([A-Z0-9]+)$/i);
    if (!m) return null;
    return { activityId: m[1], checkInCode: m[2].toUpperCase() };
  },

  renderQrCode(container, text, size = 200) {
    if (!container || !text) return;
    container.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(container, { text, width: size, height: size, correctLevel: QRCode.CorrectLevel.M });
    } else {
      container.textContent = text;
    }
  },

  async exportToExcel(data, filename, options = {}) {
    if (!data || !data.length) {
      this.showToast('Không có dữ liệu để xuất', 'warning');
      return;
    }
    if (typeof ExcelJS === 'undefined') {
      this.showToast('Thư viện ExcelJS chưa được tải', 'danger');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet(options.sheetName || 'Sheet1');
    const columns = options.columns;
    const headers = columns ? columns.map(c => c.header) : Object.keys(data[0]);
    const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);

    const headerRow = ws.addRow(headers);
    headerRow.height = 22;
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1E40AF' } },
        left: { style: 'thin', color: { argb: 'FF1E40AF' } },
        bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
        right: { style: 'thin', color: { argb: 'FF1E40AF' } }
      };
    });

    data.forEach((row, rowIndex) => {
      const values = keys.map(k => row[k] ?? '');
      const dataRow = ws.addRow(values);
      const fillArgb = rowIndex % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';
      dataRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    ws.columns.forEach((col, i) => {
      let maxLen = String(headers[i] || '').length;
      data.forEach(row => {
        const len = String(row[keys[i]] ?? '').length;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(Math.max(maxLen + 3, 12), 55);
    });

    if (options.title) {
      ws.insertRow(1, [options.title]);
      ws.mergeCells(1, 1, 1, headers.length);
      const titleCell = ws.getCell(1, 1);
      titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E40AF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 28;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  parseCheckInQrPayload(payload) {
    const prefix = 'SV5TTPDN:CHECKIN:';
    if (!payload || typeof payload !== 'string' || !payload.startsWith(prefix)) return null;
    const parts = payload.slice(prefix.length).split(':');
    if (parts.length !== 2) return null;
    return { activityId: parts[0], checkInCode: parts[1] };
  }
};