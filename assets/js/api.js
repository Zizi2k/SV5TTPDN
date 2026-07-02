/**
 * API client - giao tiếp với Google Apps Script
 */
const API = {
  async request(action, data = {}, method = 'POST') {
    if (CONFIG.API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
      console.warn('API_URL chưa được cấu hình. Sử dụng dữ liệu demo.');
      return this._demoResponse(action, data);
    }

    Utils.showLoading(true);
    try {
      const token = Auth.getToken();
      const payload = { action, ...data, token };

      let response;
      if (method === 'GET') {
        const params = new URLSearchParams(payload);
        response = await fetch(`${CONFIG.API_URL}?${params}`, { method: 'GET' });
      } else {
        response = await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
      }

      const result = await response.json();
      if (!result.success) {
        if (result.code === 'UNAUTHORIZED') Auth.logout();
        throw new Error(result.message || 'Lỗi không xác định');
      }
      return result.data;
    } catch (err) {
      Utils.showToast(err.message, 'danger');
      throw err;
    } finally {
      Utils.showLoading(false);
    }
  },

  // Auth
  login: (identifier, password) => API.request('login', { identifier, password }),
  register: (formData) => API.request('register', formData),
  logout: () => API.request('logout'),
  getProfile: () => API.request('getProfile'),
  updateProfile: (data) => API.request('updateProfile', data),

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

  // Admin
  getDashboard: () => API.request('getDashboard'),
  getPendingMembers: () => API.request('getPendingMembers'),
  getAuditLog: () => API.request('getAuditLog'),
  getSettings: () => API.request('getSettings'),

  // Upload avatar (base64)
  uploadAvatar: (base64, filename) => API.request('uploadAvatar', { base64, filename }),

  // Demo data khi chưa cấu hình API
  _demoResponse(action, data) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(DemoData[action]?.(data)), 300);
    });
  }
};

const DemoData = {
  _activities: null,

  _getActivitiesStore() {
    if (!this._activities) {
      const today = new Date();
      const d = (offset) => { const x = new Date(today); x.setDate(x.getDate() + offset); return x.toISOString().split('T')[0]; };
      this._activities = [
        { id: 'A001', name: 'Mùa hè xanh', description: 'Chương trình tình nguyện mùa hè', startDate: d(-3), endDate: d(5), location: 'Huyện Cẩm Mỹ', image: '', participants: 25, status: 'ongoing', report: '' },
        { id: 'A002', name: 'Hiến máu nhân đạo', description: 'Ngày hội hiến máu tình nguyện', startDate: d(3), endDate: d(3), location: 'Trường ĐH Công nghệ', image: '', participants: 40, status: 'upcoming', report: '' },
        { id: 'A003', name: 'Xuân tình nguyện 2025', description: 'Chương trình xuân tình nguyện', startDate: d(-30), endDate: d(-20), location: 'Toàn tỉnh', image: '', participants: 50, status: 'completed', report: 'Chương trình thành công với 50 thành viên tham gia.' }
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
    return [
      { id: 'M001', name: 'Nguyễn Văn A', role: 'Ủy viên', school: 'Đại học Công nghệ TP.HCM', faculty: 'CNTT', cohort: 'K21', avatar: '', email: 'nguyenvana@email.com' },
      { id: 'M002', name: 'Trần Thị B', role: 'Thành viên', school: 'Đại học Kinh tế', faculty: 'Quản trị', cohort: 'K22', avatar: '', email: 'tranthib@email.com' },
      { id: 'M003', name: 'Lê Văn C', role: 'Trưởng ban Sự kiện', school: 'Đại học Sư phạm', faculty: 'Văn học', cohort: 'K21', avatar: '', email: 'levanc@email.com' },
      { id: 'M004', name: 'Phạm Thị D', role: 'Thành viên', school: 'Đại học Lạc Hồng', faculty: 'Kế toán', cohort: 'K23', avatar: '', email: 'phamthid@email.com' }
    ];
  },

  getMember({ id }) {
    const members = DemoData.getMembers();
    const m = members.find(x => x.id === id) || members[0];
    return {
      ...m,
      phone: '0901234567',
      birthday: '2003-05-15',
      address: 'Biên Hòa, Đồng Nai',
      facebook: 'facebook.com/nguyenvana',
      zalo: '0901234567',
      hobbies: 'Đọc sách, Bóng đá, Tình nguyện',
      skills: 'MC, Thiết kế, Lập trình',
      quote: 'Hãy là phiên bản tốt nhất của chính mình',
      reason: 'Muốn phát triển bản thân và cống hiến cho cộng đồng',
      bio: 'Sinh viên năm 3 ngành CNTT, đam mê công nghệ và hoạt động xã hội.',
      joinDate: '2024-09-01',
      totalScore: 45,
      titles: 'Thành viên tích cực'
    };
  },

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
    return [
      { id: 'N001', title: 'Thông báo tuyển thành viên mới', content: 'CLB SV5T mở đợt tuyển thành viên mới cho năm học 2025-2026. Hạn đăng ký: 30/09/2026.', author: 'Ban Chủ nhiệm', createdAt: new Date(Date.now() - 7200000).toISOString(), pinned: true, important: true },
      { id: 'N002', title: 'Thông báo họp Ban Chủ nhiệm', content: 'Cuộc họp định kỳ tháng 7 vào lúc 19h00 ngày 10/07 tại phòng họp CLB.', author: 'Thư ký', createdAt: new Date(Date.now() - 86400000).toISOString(), pinned: false, important: false },
      { id: 'N003', title: 'Kế hoạch hoạt động tháng 9', content: 'Tháng 9 sẽ có các hoạt động: Mùa hè xanh, Hiến máu, và Workshop kỹ năng mềm.', author: 'Ban Sự kiện', createdAt: new Date(Date.now() - 172800000).toISOString(), pinned: false, important: true }
    ];
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
    return { totalMembers: 85, pendingMembers: 5, totalActivities: 12, totalAnnouncements: 8, activeMembers: 72 };
  },

  getPendingMembers() {
    return [
      { id: 'P001', name: 'Nguyễn Thị E', mssv: '2112345', school: 'ĐH Công nghệ', email: 'e@email.com', registeredAt: '2026-06-28' },
      { id: 'P002', name: 'Trần Văn F', mssv: '2212346', school: 'ĐH Kinh tế', email: 'f@email.com', registeredAt: '2026-06-29' }
    ];
  },

  register() {
    return { message: 'Đăng ký thành công! Vui lòng chờ Ban Chủ nhiệm phê duyệt.' };
  }
};
