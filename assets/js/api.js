/**
 * API client - giao tiếp với Google Apps Script
 */
const API = {
  GET_ACTIONS: new Set([
    'getMembers', 'getMember', 'getActivities', 'getActivity',
    'getAnnouncements', 'getExecutiveBoard', 'getSettings'
  ]),

  isDemoMode() {
    return !CONFIG.API_URL || CONFIG.API_URL.includes('YOUR_GOOGLE_APPS_SCRIPT');
  },

  async request(action, data = {}, options = {}) {
    const { method, silent = false, useCache = true, skipAuthHandler = false } = options;

    if (this.isDemoMode()) {
      console.warn('API_URL chưa được cấu hình. Sử dụng dữ liệu demo.');
      return this._demoResponse(action, data);
    }

    const isCacheable = useCache && this.GET_ACTIONS.has(action);
    if (isCacheable) {
      const cached = AppStore.get(action, data);
      if (cached !== null) return cached;
    }

    if (!silent) Utils.showLoading(true);
    try {
      const token = Auth.getToken();
      const payload = { action, ...data };
      if (token) payload.token = token;

      const useGet = method === 'GET' || this.GET_ACTIONS.has(action);
      let response;

      if (useGet) {
        const params = new URLSearchParams();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
        response = await fetch(`${CONFIG.API_URL}?${params}`, {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store'
        });
      } else {
        response = await fetch(CONFIG.API_URL, {
          method: 'POST',
          redirect: 'follow',
          cache: 'no-store',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      }

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Không thể kết nối API. Kiểm tra URL Google Apps Script và quyền truy cập.');
      }
      if (!result.success) {
        if (result.code === 'UNAUTHORIZED' && !skipAuthHandler && action !== 'logout') {
          Auth.handleUnauthorized(result.message);
        }
        throw new Error(result.message || 'Lỗi không xác định');
      }

      if (isCacheable) {
        AppStore.set(action, data, result.data);
      }
      this._invalidateAfter(action);

      return result.data;
    } catch (err) {
      if (!silent && !Auth._loggingOut) Utils.showToast(err.message, 'danger');
      throw err;
    } finally {
      if (!silent) Utils.showLoading(false);
    }
  },

  _invalidateAfter(action) {
    const keys = CACHE_INVALIDATION[action];
    if (action === 'logout') {
      AppStore.clear();
      return;
    }
    if (keys?.length) {
      AppStore.invalidateMany(keys);
    }
  },

  // Auth
  login: (identifier, password) => API.request('login', { identifier, password }),
  register: (formData) => API.request('register', formData),
  logout: () => API.request('logout'),
  getProfile: () => API.request('getProfile'),
  updateProfile: (data) => API.request('updateProfile', data),
  changePassword: (data) => API.request('changePassword', data),

  // Members
  getMembers: (filters = {}) => API.request('getMembers', filters),
  getMember: (id) => API.request('getMember', { id }),
  addMember: (data) => API.request('addMember', data),
  updateMember: (id, data) => API.request('updateMember', { id, ...data }),
  deleteMember: (id) => API.request('deleteMember', { id }),
  approveMember: (id) => API.request('approveMember', { id }),
  lockMember: (id) => API.request('lockMember', { id }),
  resetPassword: (id) => API.request('resetPassword', { id }),

  // Activities
  getActivities: (filters = {}) => API.request('getActivities', filters),
  getActivity: (id) => API.request('getActivity', { id }),
  addActivity: (data) => API.request('addActivity', data),
  updateActivity: (id, data) => API.request('updateActivity', { id, ...data }),
  deleteActivity: (id) => API.request('deleteActivity', { id }),
  joinActivity: (activityId) => API.request('joinActivity', { activityId }),
  getActivityParticipants: (activityId) => API.request('getActivityParticipants', { activityId }),

  // Announcements
  getAnnouncements: (filters = {}) => API.request('getAnnouncements', filters),
  addAnnouncement: (data) => API.request('addAnnouncement', data),
  updateAnnouncement: (id, data) => API.request('updateAnnouncement', { id, ...data }),
  deleteAnnouncement: (id) => API.request('deleteAnnouncement', { id }),
  togglePinAnnouncement: (id) => API.request('togglePinAnnouncement', { id }),

  // Executive Board
  getExecutiveBoard: () => API.request('getExecutiveBoard'),
  updateExecutiveBoard: (data) => API.request('updateExecutiveBoard', data),

  // Scores
  getScores: (memberId) => API.request('getScores', { memberId }),
  addScore: (data) => API.request('addScore', data),

  // Attendance
  checkIn: (activityId, qrCode) => API.request('checkIn', { activityId, qrCode }),
  getActivityCheckInInfo: (activityId) => API.request('getActivityCheckInInfo', { activityId }, { useCache: false }),
  setActivityQrVisible: (activityId, visible) => API.request('setActivityQrVisible', { activityId, visible }),
  memberCheckIn: (activityId, data) => API.request('memberCheckIn', { activityId, ...data }),
  getActivityAttendanceList: (activityId) => API.request('getActivityAttendanceList', { activityId }, { useCache: false }),
  uploadAttendanceProof: (base64, filename, activityId) => API.request('uploadAttendanceProof', { base64, filename, activityId }),

  // Admin
  getDashboard: () => API.request('getDashboard'),
  getPendingMembers: () => API.request('getPendingMembers'),
  getAuditLog: () => API.request('getAuditLog'),
  getSettings: () => API.request('getSettings'),

  // Upload avatar (base64)
  uploadAvatar: (base64, filename, memberId) => API.request('uploadAvatar', { base64, filename, memberId }),
  uploadClubLogo: (base64, filename) => API.request('uploadClubLogo', { base64, filename }),

  // Demo data khi chưa cấu hình API
  _demoResponse(action, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const fn = DemoData[action];
          if (!fn) {
            resolve({ message: 'Thao tác demo thành công' });
            return;
          }
          resolve(fn(data));
        } catch (e) {
          reject(e);
        }
      }, 300);
    });
  }
};

const DemoData = {
  _activities: null,
  _members: null,
  _pending: null,
  _announcements: null,
  _attendance: null,
  _participants: null,

  _getMembersStore() {
    if (!this._members) {
      this._members = [
        { id: 'M001', name: 'Nguyễn Văn A', mssv: '2110001', role: 'Ủy viên', school: 'Đại học Công nghệ TP.HCM', faculty: 'CNTT', cohort: 'K21', avatar: '', email: 'nguyenvana@email.com', phone: '0901234567', bio: '' },
        { id: 'M002', name: 'Trần Thị B', mssv: '2210002', role: 'Thành viên', school: 'Đại học Kinh tế', faculty: 'Quản trị', cohort: 'K22', avatar: '', email: 'tranthib@email.com', phone: '', bio: '' },
        { id: 'M003', name: 'Lê Văn C', mssv: '2110003', role: 'Trưởng ban Sự kiện', school: 'Đại học Sư phạm', faculty: 'Văn học', cohort: 'K21', avatar: '', email: 'levanc@email.com', phone: '', bio: '' }
      ];
    }
    return this._members;
  },

  _getPendingStore() {
    if (!this._pending) {
      this._pending = [
        { id: 'P001', name: 'Nguyễn Thị E', mssv: '2112345', school: 'ĐH Công nghệ', email: 'e@email.com', registeredAt: '2026-06-28' }
      ];
    }
    return this._pending;
  },


  _getParticipantsStore() {
    if (!this._participants) this._participants = { A001: ['M001'] };
    return this._participants;
  },

  _getAttendanceStore() {
    if (!this._attendance) this._attendance = [];
    return this._attendance;
  },

  _demoCheckInCode(activityId) {
    return 'DEMO' + String(activityId).slice(-4).padStart(4, '0');
  },

  _demoQrPayload(activityId) {
    return 'SV5TTPDN:CHECKIN:' + activityId + ':' + this._demoCheckInCode(activityId);
  },

  _isDemoRegistered(activityId, user) {
    const uid = user?.memberId || user?.id;
    if (!uid) return false;
    const parts = this._getParticipantsStore();
    return (parts[activityId] || []).includes(uid);
  },
  _getAnnouncementsStore() {
    if (!this._announcements) {
      this._announcements = [
        { id: 'N001', title: 'Thông báo tuyển thành viên mới', content: 'CLB SV5T mở đợt tuyển thành viên mới.', author: 'Ban Chủ nhiệm', createdAt: new Date(Date.now() - 7200000).toISOString(), pinned: true, important: true },
        { id: 'N002', title: 'Thông báo họp Ban Chủ nhiệm', content: 'Cuộc họp định kỳ tháng 7.', author: 'Thư ký', createdAt: new Date(Date.now() - 86400000).toISOString(), pinned: false, important: false }
      ];
    }
    return this._announcements;
  },

  _getActivitiesStore() {
    if (!this._activities) {
      const today = new Date();
      const d = (offset) => { const x = new Date(today); x.setDate(x.getDate() + offset); return x.toISOString().split('T')[0]; };
      this._activities = [
        { id: 'A001', name: 'Mùa hè xanh', description: 'Chương trình tình nguyện mùa hè', startDate: d(-3), endDate: d(5), location: 'Huyện Cẩm Mỹ', image: '', participants: 25, status: 'ongoing', report: '', qrVisible: false, attendanceCount: 0 },
        { id: 'A002', name: 'Hiến máu nhân đạo', description: 'Ngày hội hiến máu tình nguyện', startDate: d(3), endDate: d(3), location: 'Trường ĐH Công nghệ', image: '', participants: 40, status: 'upcoming', report: '', qrVisible: false, attendanceCount: 0 },
        { id: 'A003', name: 'Xuân tình nguyện 2025', description: 'Chương trình xuân tình nguyện', startDate: d(-30), endDate: d(-20), location: 'Toàn tỉnh', image: '', participants: 50, status: 'completed', qrVisible: false, attendanceCount: 0, report: 'Chương trình thành công với 50 thành viên tham gia.' }
      ];
    }
    return this._activities;
  },

  login({ identifier, password }) {
    if (identifier === 'admin' && password === 'admin123') {
      return { token: 'demo-token', user: { id: '1', name: 'Admin', role: 'admin', email: 'admin@sv5t.vn' } };
    }
    if (identifier === 'member' && password === 'member123') {
      return { token: 'demo-token', user: { id: '2', name: 'Nguyễn Văn A', role: 'member', email: 'nguyenvana@email.com', memberId: 'M001' } };
    }
    throw new Error('Email/MSSV hoặc mật khẩu không đúng');
  },

  getMembers() {
    return DemoData._getMembersStore().map(m => ({ ...m }));
  },

  getMember({ id }) {
    const m = DemoData._getMembersStore().find(x => x.id === id) || DemoData._getMembersStore()[0];
    return {
      ...m,
      phone: m.phone || '0901234567',
      birthday: '2003-05-15',
      address: 'Biên Hòa, Đồng Nai',
      facebook: '', zalo: '',
      hobbies: 'Đọc sách, Bóng đá',
      skills: 'MC, Lập trình',
      quote: '', reason: '', bio: m.bio || '',
      joinDate: '2024-09-01', totalScore: 45, titles: 'Thành viên tích cực'
    };
  },

  addMember(data) {
    const id = 'M' + Date.now();
    DemoData._getMembersStore().push({
      id, name: data.name, mssv: data.mssv || '', email: data.email,
      role: data.role || 'Thành viên', school: data.school || '', faculty: data.faculty || '',
      cohort: data.cohort || '', phone: data.phone || '', bio: data.bio || '', avatar: ''
    });
    return { id, message: 'Đã thêm thành viên' };
  },

  updateMember(data) {
    const store = DemoData._getMembersStore();
    const idx = store.findIndex(m => m.id === data.id);
    if (idx === -1) throw new Error('Không tìm thấy thành viên');
    Object.assign(store[idx], {
      name: data.name ?? store[idx].name,
      mssv: data.mssv ?? store[idx].mssv,
      email: data.email ?? store[idx].email,
      phone: data.phone ?? store[idx].phone,
      school: data.school ?? store[idx].school,
      faculty: data.faculty ?? store[idx].faculty,
      className: data.className ?? store[idx].className,
      cohort: data.cohort ?? store[idx].cohort,
      role: data.role ?? store[idx].role,
      bio: data.bio ?? store[idx].bio,
      titles: data.titles ?? store[idx].titles,
      joinDate: data.joinDate ?? store[idx].joinDate
    });
    return { message: 'Cập nhật thành công' };
  },

  deleteMember({ id }) {
    let store = DemoData._getMembersStore();
    let idx = store.findIndex(m => m.id === id);
    if (idx !== -1) { store.splice(idx, 1); return { message: 'Đã xóa' }; }
    store = DemoData._getPendingStore();
    idx = store.findIndex(m => m.id === id);
    if (idx !== -1) { store.splice(idx, 1); return { message: 'Đã xóa' }; }
    throw new Error('Không tìm thấy thành viên');
  },

  approveMember({ id }) {
    const pending = DemoData._getPendingStore();
    const idx = pending.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Không tìm thấy đơn đăng ký');
    const p = pending.splice(idx, 1)[0];
    DemoData._getMembersStore().push({
      id: 'M' + Date.now(), name: p.name, mssv: p.mssv, email: p.email,
      school: p.school, role: 'Thành viên', faculty: '', cohort: '', avatar: '', phone: '', bio: ''
    });
    return { message: 'Đã duyệt' };
  },

  lockMember() { return { message: 'Đã khóa tài khoản' }; },
  resetPassword() { return { message: 'Đã reset mật khẩu' }; },

  getActivities() {
    return DemoData._getActivitiesStore().map(a => ({ ...a }));
  },

  getActivity({ id }) {
    const activity = DemoData._getActivitiesStore().find(a => a.id === id);
    if (!activity) throw new Error('Không tìm thấy hoạt động');
    return { ...activity };
  },

  addActivity(data) {
    const id = 'A' + Date.now();
    const activity = {
      id,
      name: data.name,
      description: data.description || '',
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location || '',
      image: data.image || '',
      report: '',
      participants: 0,
      status: Utils.getActivityStatus(data.startDate, data.endDate)
    };
    DemoData._getActivitiesStore().push(activity);
    return { id, message: 'Đã thêm hoạt động' };
  },

  updateActivity(data) {
    const store = DemoData._getActivitiesStore();
    const idx = store.findIndex(a => a.id === data.id);
    if (idx === -1) throw new Error('Không tìm thấy hoạt động');
    const updated = {
      ...store[idx],
      name: data.name ?? store[idx].name,
      description: data.description ?? store[idx].description,
      startDate: data.startDate ?? store[idx].startDate,
      endDate: data.endDate ?? store[idx].endDate,
      location: data.location ?? store[idx].location,
      report: data.report ?? store[idx].report
    };
    updated.status = Utils.getActivityStatus(updated.startDate, updated.endDate);
    store[idx] = updated;
    return { message: 'Cập nhật thành công' };
  },

  deleteActivity({ id }) {
    const store = DemoData._getActivitiesStore();
    const idx = store.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Không tìm thấy hoạt động');
    store.splice(idx, 1);
    return { message: 'Đã xóa hoạt động' };
  },

  getAnnouncements() {
    return DemoData._getAnnouncementsStore().map(a => ({ ...a }));
  },

  addAnnouncement(data) {
    const id = 'N' + Date.now();
    DemoData._getAnnouncementsStore().unshift({
      id, title: data.title, content: data.content,
      author: 'Admin', createdAt: new Date().toISOString(),
      pinned: !!data.pinned, important: !!data.important
    });
    return { id, message: 'Đã đăng thông báo' };
  },

  updateAnnouncement(data) {
    const store = DemoData._getAnnouncementsStore();
    const item = store.find(n => n.id === data.id);
    if (!item) throw new Error('Không tìm thấy thông báo');
    Object.assign(item, {
      title: data.title ?? item.title,
      content: data.content ?? item.content,
      pinned: data.pinned ?? item.pinned,
      important: data.important ?? item.important
    });
    return { message: 'Cập nhật thành công' };
  },

  deleteAnnouncement({ id }) {
    const store = DemoData._getAnnouncementsStore();
    const idx = store.findIndex(n => n.id === id);
    if (idx === -1) throw new Error('Không tìm thấy');
    store.splice(idx, 1);
    return { message: 'Đã ẩn' };
  },

  togglePinAnnouncement({ id }) {
    const item = DemoData._getAnnouncementsStore().find(n => n.id === id);
    if (!item) throw new Error('Không tìm thấy');
    item.pinned = !item.pinned;
    return { pinned: item.pinned };
  },

  getExecutiveBoard() {
    return [
      { id: 'E001', name: 'Nguyễn Văn Minh', position: 'Chủ nhiệm', avatar: '', bio: 'Sinh viên năm 4, đam mê hoạt động xã hội.', email: 'minh@sv5t.vn', phone: '0901111111', order: 1 },
      { id: 'E002', name: 'Trần Thị Lan', position: 'Phó Chủ nhiệm', avatar: '', bio: 'Phụ trách hoạt động nội bộ CLB.', email: 'lan@sv5t.vn', phone: '0902222222', order: 2 },
      { id: 'E003', name: 'Lê Hoàng Nam', position: 'Thư ký', avatar: '', bio: 'Quản lý hồ sơ và tài liệu CLB.', email: 'nam@sv5t.vn', phone: '0903333333', order: 3 },
      { id: 'E004', name: 'Phạm Thu Hà', position: 'Trưởng ban Truyền thông', avatar: '', bio: 'Chịu trách nhiệm truyền thông và mạng xã hội.', email: 'ha@sv5t.vn', phone: '0904444444', order: 4 },
      { id: 'E005', name: 'Võ Đức Anh', position: 'Trưởng ban Đối ngoại', avatar: '', bio: 'Liên kết với các CLB và tổ chức bạn.', email: 'anh@sv5t.vn', phone: '0905555555', order: 5 },
      { id: 'E006', name: 'Hoàng Thị Mai', position: 'Trưởng ban Sự kiện', avatar: '', bio: 'Tổ chức các sự kiện và hoạt động CLB.', email: 'mai@sv5t.vn', phone: '0906666666', order: 6 },
      { id: 'E007', name: 'Đặng Văn Tú', position: 'Trưởng ban Hậu cần', avatar: '', bio: 'Hỗ trợ logistics và tài chính CLB.', email: 'tu@sv5t.vn', phone: '0907777777', order: 7 }
    ];
  },

  getScores({ memberId }) {
    return {
      items: [
        { activity: 'Hiến máu', score: 10, date: '2025-03-15' },
        { activity: 'Mùa hè xanh', score: 20, date: '2025-07-01' },
        { activity: 'Xuân tình nguyện', score: 15, date: '2025-01-20' }
      ],
      total: 45
    };
  },

  getDashboard() {
    return {
      totalMembers: DemoData._getMembersStore().length,
      pendingMembers: DemoData._getPendingStore().length,
      totalActivities: DemoData._getActivitiesStore().length,
      totalAnnouncements: DemoData._getAnnouncementsStore().length,
      activeMembers: DemoData._getMembersStore().length
    };
  },

  getPendingMembers() {
    return DemoData._getPendingStore().map(p => ({ ...p }));
  },

  getAuditLog() { return []; },

  addScore() { return { message: 'Đã cộng điểm', total: 0 }; },


  getActivityCheckInInfo({ activityId }) {
    const activity = DemoData._getActivitiesStore().find(a => a.id === activityId);
    if (!activity) throw new Error('Không tìm thấy hoạt động');
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const isAdmin = user && (user.role === 'admin' || user.role === 'executive');
    const registered = DemoData._isDemoRegistered(activityId, user);
    const qrVisible = !!activity.qrVisible;
    if (!isAdmin && !registered) {
      throw new Error('Bạn chưa đăng ký tham gia hoạt động này');
    }
    const memberId = user?.memberId || user?.id;
    const alreadyCheckedIn = DemoData._getAttendanceStore().some(a => a.activityId === activityId && a.memberId === memberId);
    const attendanceCount = DemoData._getAttendanceStore().filter(a => a.activityId === activityId).length;
    return {
      activityId,
      activityName: activity.name,
      status: activity.status || Utils.getActivityStatus(activity.startDate, activity.endDate),
      checkInCode: DemoData._demoCheckInCode(activityId),
      qrPayload: (isAdmin || (qrVisible && registered)) ? DemoData._demoQrPayload(activityId) : (isAdmin ? DemoData._demoQrPayload(activityId) : ''),
      qrVisible,
      canSeeQr: isAdmin || (qrVisible && registered),
      canManage: !!isAdmin,
      isRegistered: registered,
      registered,
      hasCheckedIn: alreadyCheckedIn,
      alreadyCheckedIn,
      attendanceCount,
      participants: (DemoData._getParticipantsStore()[activityId] || []).length,
      isAdmin: !!isAdmin
    };
  },

  setActivityQrVisible({ activityId, visible }) {
    const activity = DemoData._getActivitiesStore().find(a => a.id === activityId);
    if (!activity) throw new Error('Không tìm thấy hoạt động');
    activity.qrVisible = visible === true || visible === 'true' || visible === true;
    const info = DemoData.getActivityCheckInInfo({ activityId });
    return { ...info, message: activity.qrVisible ? 'Đã hiển thị QR cho thành viên' : 'Đã ẩn QR khỏi thành viên' };
  },

  memberCheckIn({ activityId, method, qrPayload, proofImage }) {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const memberId = user?.memberId || user?.id || 'M001';
    if (!DemoData._isDemoRegistered(activityId, user)) {
      throw new Error('Bạn chưa đăng ký tham gia hoạt động này');
    }
    const store = DemoData._getAttendanceStore();
    if (store.some(a => a.activityId === activityId && a.memberId === memberId)) {
      throw new Error('Đã điểm danh');
    }
    if (method === 'qr') {
      const parsed = Utils.parseCheckInQrPayload(payload.qrPayload || '');
      const code = payload.checkInCode || (parsed ? parsed.checkInCode : '');
      const expected = DemoData._demoCheckInCode(activityId);
      if (!code || code.toUpperCase() !== expected) throw new Error('Mã QR không hợp lệ');
    } else if (method === 'manual') {
      if (!proofImage) throw new Error('Vui lòng gửi ảnh minh chứng');
    } else {
      throw new Error('Phương thức điểm danh không hợp lệ');
    }
    store.push({
      activityId,
      memberId,
      method: method || 'manual',
      proofImage: proofImage || '',
      checkedInAt: new Date().toISOString(),
      checkedInBy: user?.id || memberId
    });
    return { message: 'Điểm danh thành công' };
  },

  getActivityAttendanceList({ activityId }) {
    const activity = DemoData._getActivitiesStore().find(a => a.id === activityId);
    if (!activity) throw new Error('Không tìm thấy hoạt động');
    const members = DemoData._getMembersStore();
    const rows = DemoData._getAttendanceStore()
      .filter(a => a.activityId === activityId)
      .map((att, index) => {
        const m = members.find(mem => mem.id === att.memberId);
        return {
          stt: index + 1,
          memberId: att.memberId,
          name: m ? m.name : 'Unknown',
          mssv: m ? m.mssv : '',
          email: m ? m.email : '',
          phone: m ? m.phone : '',
          method: att.method || 'manual',
          proofImage: att.proofImage || '',
          checkedInAt: att.checkedInAt,
          checkedInBy: att.checkedInBy
        };
      });
    return {
      activity: { ...activity, attendanceCount: rows.length },
      rows
    };
  },

  uploadAttendanceProof({ base64, filename }) {
    const mime = (filename || '').toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    return { url: `data:${mime};base64,${base64}` };
  },


  getActivityParticipants({ activityId }) {
    const parts = DemoData._getParticipantsStore()[activityId] || [];
    const members = DemoData._getMembersStore();
    return parts.map(memberId => {
      const m = members.find(mem => mem.id === memberId);
      return {
        memberId,
        name: m ? m.name : 'Unknown',
        joinedAt: new Date().toISOString()
      };
    });
  },
  joinActivity({ activityId }) {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const memberId = user?.memberId || user?.id || 'M001';
    const parts = DemoData._getParticipantsStore();
    if (!parts[activityId]) parts[activityId] = [];
    if (parts[activityId].includes(memberId)) throw new Error('Bạn đã đăng ký hoạt động này');
    parts[activityId].push(memberId);
    const activity = DemoData._getActivitiesStore().find(a => a.id === activityId);
    if (activity) activity.participants = parts[activityId].length;
    return { message: 'Đã đăng ký tham gia' };
  },
  checkIn() { return { message: 'Điểm danh thành công' }; },

  updateProfile(data) {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const id = user?.memberId || user?.id || 'M001';
    const store = DemoData._getMembersStore();
    const member = store.find(m => m.id === id);
    if (member) {
      ['phone', 'address', 'facebook', 'zalo', 'hobbies', 'skills', 'quote', 'bio', 'titles', 'joinDate'].forEach(f => {
        if (data[f] !== undefined) member[f] = data[f];
      });
    }
    return { message: 'Cập nhật thành công' };
  },

  changePassword() { return { message: 'Đã đổi mật khẩu thành công' }; },

  register() {
    return { message: 'Đăng ký thành công! Vui lòng chờ Ban Chủ nhiệm phê duyệt.' };
  },

  getSettings() {
    return {
      club_name: CONFIG.CLUB_NAME,
      contact_email: 'clbsv5t.dongnai@gmail.com',
      club_logo: localStorage.getItem('club_logo') || ''
    };
  },

  uploadAvatar({ base64, filename, memberId }) {
    const mime = (filename || '').toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const url = `data:${mime};base64,${base64}`;
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const id = memberId || user?.memberId || user?.id || 'M001';
    const store = DemoData._getMembersStore();
    const member = store.find(m => m.id === id);
    if (member) member.avatar = url;
    return { url, memberId: id };
  },

  uploadClubLogo({ base64, filename }) {
    const mime = (filename || '').toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const url = `data:${mime};base64,${base64}`;
    localStorage.setItem('club_logo', url);
    return { url };
  }
};
