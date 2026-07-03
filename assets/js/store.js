/**
 * Cache & state SPA — giảm gọi API trùng lặp
 */
const AppStore = {
  cache: new Map(),
  DEFAULT_TTL: 60000,

  _key(action, data) {
    return action + ':' + JSON.stringify(data || {});
  },

  get(action, data) {
    const entry = this.cache.get(this._key(action, data));
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(this._key(action, data));
      return null;
    }
    return entry.data;
  },

  set(action, data, value, ttl) {
    this.cache.set(this._key(action, data), {
      data: value,
      expires: Date.now() + (ttl || this.DEFAULT_TTL)
    });
  },

  invalidate(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix + ':') || key === prefix) {
        this.cache.delete(key);
      }
    }
  },

  invalidateMany(actions) {
    actions.forEach(a => this.invalidate(a));
  },

  clear() {
    this.cache.clear();
  }
};

const CACHE_INVALIDATION = {
  login: ['getMembers', 'getDashboard', 'getPendingMembers', 'getAnnouncements', 'getActivities'],
  logout: [],
  register: ['getPendingMembers', 'getDashboard'],
  addMember: ['getMembers', 'getDashboard', 'getMember'],
  updateMember: ['getMembers', 'getMember', 'getDashboard'],
  deleteMember: ['getMembers', 'getDashboard', 'getPendingMembers', 'getMember'],
  approveMember: ['getMembers', 'getPendingMembers', 'getDashboard'],
  lockMember: ['getMembers', 'getMember'],
  resetPassword: [],
  addActivity: ['getActivities', 'getActivity', 'getDashboard'],
  updateActivity: ['getActivities', 'getActivity'],
  deleteActivity: ['getActivities', 'getActivity', 'getDashboard'],
  joinActivity: ['getActivities', 'getActivity'],
  addAnnouncement: ['getAnnouncements'],
  updateAnnouncement: ['getAnnouncements'],
  deleteAnnouncement: ['getAnnouncements'],
  togglePinAnnouncement: ['getAnnouncements'],
  addScore: ['getScores', 'getMember'],
  checkIn: ['getActivities', 'getActivity'],
  memberCheckIn: ['getActivities', 'getActivity'],
  setActivityQrVisible: ['getActivities', 'getActivity'],
  uploadAttendanceProof: [],
  updateProfile: ['getMember'],
  changePassword: [],
  uploadAvatar: ['getMember', 'getMembers'],
  uploadClubLogo: ['getSettings']
};
