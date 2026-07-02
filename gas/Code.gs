/**
 * CLB SV5T - Google Apps Script Backend
 * Entry point: doGet / doPost
 */

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  let payload = {};
  try {
    if (method === 'POST' && e.postData) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    if (!action) {
      return jsonResponse({ success: false, message: 'Thiếu action' });
    }

    const result = routeAction(action, payload);
    return jsonResponse({ success: true, data: result });
  } catch (err) {
    const code = err.code || 'ERROR';
    if (code === 'UNAUTHORIZED') {
      return jsonResponse({ success: false, code: 'UNAUTHORIZED', message: err.message });
    }
    logAudit('ERROR', err.message, payload.token || null);
    return jsonResponse({ success: false, message: err.message || 'Lỗi hệ thống' });
  }
}

function routeAction(action, payload) {
  const publicActions = ['login', 'register', 'getMembers', 'getMember', 'getActivities', 'getActivity', 'getAnnouncements', 'getExecutiveBoard'];

  if (!publicActions.includes(action)) {
    const user = validateToken(payload.token);
    payload._user = user;
  }

  const routes = {
    // Auth
    login: () => authLogin(payload.identifier, payload.password),
    register: () => authRegister(payload),
    logout: () => authLogout(payload.token),
    getProfile: () => getProfile(payload._user),

    // Members
    getMembers: () => getMembers(payload),
    getMember: () => getMember(payload.id),
    addMember: () => requireRole(payload._user, ['admin', 'executive']) || addMember(payload),
    updateMember: () => requireRole(payload._user, ['admin', 'executive']) || updateMember(payload.id, payload),
    deleteMember: () => requireRole(payload._user, ['admin', 'executive']) || deleteMember(payload.id),
    approveMember: () => requireRole(payload._user, ['admin', 'executive']) || approveMember(payload.id, payload._user),
    lockMember: () => requireRole(payload._user, ['admin']) || lockMember(payload.id),
    resetPassword: () => requireRole(payload._user, ['admin']) || resetPassword(payload.id),
    getPendingMembers: () => requireRole(payload._user, ['admin', 'executive']) || getPendingMembers(),
    updateProfile: () => updateProfile(payload._user, payload),

    // Activities
    getActivities: () => getActivities(payload),
    getActivity: () => getActivity(payload.id),
    addActivity: () => requireRole(payload._user, ['admin', 'executive']) || addActivity(payload, payload._user),
    updateActivity: () => requireRole(payload._user, ['admin', 'executive']) || updateActivity(payload.id, payload),
    deleteActivity: () => requireRole(payload._user, ['admin', 'executive']) || deleteActivity(payload.id),
    joinActivity: () => joinActivity(payload.activityId, payload._user),
    getActivityParticipants: () => getActivityParticipants(payload.activityId),

    // Announcements
    getAnnouncements: () => getAnnouncements(payload),
    addAnnouncement: () => requireRole(payload._user, ['admin', 'executive']) || addAnnouncement(payload, payload._user),
    updateAnnouncement: () => requireRole(payload._user, ['admin', 'executive']) || updateAnnouncement(payload.id, payload),
    deleteAnnouncement: () => requireRole(payload._user, ['admin']) || deleteAnnouncement(payload.id),
    togglePinAnnouncement: () => requireRole(payload._user, ['admin', 'executive']) || togglePinAnnouncement(payload.id),

    // Executive Board
    getExecutiveBoard: () => getExecutiveBoard(),
    updateExecutiveBoard: () => requireRole(payload._user, ['admin']) || updateExecutiveBoard(payload),

    // Scores
    getScores: () => getScores(payload.memberId || payload._user.memberId),
    addScore: () => requireRole(payload._user, ['admin', 'executive']) || addScore(payload, payload._user),

    // Attendance
    checkIn: () => requireRole(payload._user, ['admin', 'executive']) || checkIn(payload.activityId, payload.qrCode, payload._user),

    // Admin
    getDashboard: () => requireRole(payload._user, ['admin', 'executive']) || getDashboard(),
    getAuditLog: () => requireRole(payload._user, ['admin']) || getAuditLog(),
    getSettings: () => getSettings(),
    uploadAvatar: () => uploadAvatar(payload.base64, payload.filename, payload._user),

    // Setup helper
    initializeSheets: () => initializeSheets()
  };

  if (!routes[action]) {
    throw new Error('Action không hợp lệ: ' + action);
  }

  return routes[action]();
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function requireRole(user, roles) {
  if (!user || !roles.includes(user.role)) {
    const err = new Error('Bạn không có quyền thực hiện thao tác này');
    err.code = 'UNAUTHORIZED';
    throw err;
  }
}
