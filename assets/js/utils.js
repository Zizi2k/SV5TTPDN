/**
 * Tiện ích dùng chung
 */
const Utils = {
  showLoading(show = true) {
    document.getElementById('loadingOverlay').classList.toggle('d-none', !show);
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
    return url || this.defaultAvatar(name);
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
  }
};
