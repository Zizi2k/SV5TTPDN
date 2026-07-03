/**
 * Quản lý hoạt động & điểm danh
 */

function getActivities(filters) {
  return getSheetData(SHEET_NAMES.ACTIVITIES).map(a => sanitizeActivity(a));
}

function sanitizeActivity(a) {
  const participants = getSheetData(SHEET_NAMES.ACTIVITY_PARTICIPANTS)
    .filter(p => p.activityId === a.id).length;
  const attendanceCount = getSheetData(SHEET_NAMES.ATTENDANCE)
    .filter(at => at.activityId === a.id).length;
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    startDate: formatDate(a.startDate),
    endDate: formatDate(a.endDate),
    location: a.location,
    image: a.image,
    report: a.report,
    checkInCode: a.checkInCode || '',
    qrVisible: a.qrVisible === true || a.qrVisible === 'TRUE',
    participants: participants,
    attendanceCount: attendanceCount,
    status: getActivityStatus(a.startDate, a.endDate)
  };
}

function getActivity(id) {
  const raw = getSheetData(SHEET_NAMES.ACTIVITIES).find(a => a.id === id);
  if (!raw) throw new Error('Không tìm thấy hoạt động');
  return sanitizeActivity(raw);
}

function getActivityStatus(startDate, endDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (now > end) return 'completed';
  if (now >= start) return 'ongoing';
  return 'upcoming';
}

function ensureActivityCheckInCode(activityId) {
  const raw = getSheetData(SHEET_NAMES.ACTIVITIES).find(a => a.id === activityId);
  if (!raw) throw new Error('Không tìm thấy hoạt động');
  if (raw.checkInCode) return String(raw.checkInCode);
  const code = Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
  updateRow(SHEET_NAMES.ACTIVITIES, activityId, { checkInCode: code });
  return code;
}

function buildQrPayload(activityId, checkInCode) {
  return 'SV5TTPDN:CHECKIN:' + activityId + ':' + checkInCode;
}

function isActivityParticipant(activityId, memberId) {
  return getSheetData(SHEET_NAMES.ACTIVITY_PARTICIPANTS)
    .some(p => p.activityId === activityId && p.memberId === memberId);
}

function hasCheckedIn(activityId, memberId) {
  return getSheetData(SHEET_NAMES.ATTENDANCE)
    .some(a => a.activityId === activityId && a.memberId === memberId);
}

function addActivity(payload, user) {
  const id = generateId('A');
  const code = Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
  appendRow(SHEET_NAMES.ACTIVITIES, {
    id: id,
    name: payload.name,
    description: payload.description || '',
    startDate: payload.startDate,
    endDate: payload.endDate,
    location: payload.location || '',
    image: payload.image || '',
    report: '',
    checkInCode: code,
    qrVisible: false,
    createdBy: user.id,
    createdAt: formatDateTime(now())
  });
  logAudit('ADD_ACTIVITY', id, null);
  return { id, message: 'Đã thêm hoạt động' };
}

function updateActivity(id, payload) {
  const allowed = ['name', 'description', 'startDate', 'endDate', 'location', 'image', 'report', 'qrVisible'];
  const updates = {};
  allowed.forEach(f => { if (payload[f] !== undefined) updates[f] = payload[f]; });
  updateRow(SHEET_NAMES.ACTIVITIES, id, updates);
  logAudit('UPDATE_ACTIVITY', id, null);
  return { message: 'Cập nhật thành công' };
}

function deleteActivity(id) {
  deleteRow(SHEET_NAMES.ACTIVITIES, id);
  logAudit('DELETE_ACTIVITY', id, null);
  return { message: 'Đã xóa hoạt động' };
}

function joinActivity(activityId, user) {
  const activity = getSheetData(SHEET_NAMES.ACTIVITIES).find(a => a.id === activityId);
  if (!activity) throw new Error('Hoạt động không tồn tại');
  if (getSheetData(SHEET_NAMES.ACTIVITY_PARTICIPANTS)
    .find(p => p.activityId === activityId && p.memberId === user.memberId)) {
    throw new Error('Bạn đã đăng ký hoạt động này');
  }
  appendRow(SHEET_NAMES.ACTIVITY_PARTICIPANTS, {
    id: generateId('P'),
    activityId: activityId,
    memberId: user.memberId,
    joinedAt: formatDateTime(now())
  });
  logAudit('JOIN_ACTIVITY', activityId + ' by ' + user.memberId, null);
  return { message: 'Đã đăng ký tham gia' };
}

function getActivityParticipants(activityId) {
  const participants = getSheetData(SHEET_NAMES.ACTIVITY_PARTICIPANTS)
    .filter(p => p.activityId === activityId);
  const members = getSheetData(SHEET_NAMES.MEMBERS);
  return participants.map(p => {
    const m = members.find(mem => mem.id === p.memberId);
    return {
      memberId: p.memberId,
      name: m ? m.name : 'Unknown',
      mssv: m ? m.mssv : '',
      school: m ? m.school : '',
      joinedAt: p.joinedAt
    };
  });
}

function getActivityCheckInInfo(activityId, user) {
  const activity = getActivity(activityId);
  const checkInCode = ensureActivityCheckInCode(activityId);
  const isAdmin = user && (user.role === 'admin' || user.role === 'executive');
  const memberId = user ? user.memberId : '';
  const isRegistered = memberId ? isActivityParticipant(activityId, memberId) : false;
  const canSeeQr = isAdmin || (activity.status === 'ongoing' && activity.qrVisible && isRegistered);

  return {
    activityId: activity.id,
    activityName: activity.name,
    status: activity.status,
    checkInCode: checkInCode,
    qrPayload: canSeeQr || isAdmin ? buildQrPayload(activityId, checkInCode) : '',
    qrVisible: activity.qrVisible,
    canSeeQr: canSeeQr,
    canManage: !!isAdmin,
    isRegistered: isRegistered,
    hasCheckedIn: memberId ? hasCheckedIn(activityId, memberId) : false,
    attendanceCount: activity.attendanceCount,
    participants: activity.participants
  };
}

function setActivityQrVisible(activityId, visible, user) {
  if (!user || (user.role !== 'admin' && user.role !== 'executive')) {
    throw new Error('Bạn không có quyền thực hiện thao tác này');
  }
  if (getActivity(activityId).status !== 'ongoing') {
    throw new Error('Chỉ áp dụng cho hoạt động đang diễn ra');
  }
  updateRow(SHEET_NAMES.ACTIVITIES, activityId, { qrVisible: !!visible });
  logAudit('SET_QR_VISIBLE', activityId + ':' + visible, null);
  return getActivityCheckInInfo(activityId, user);
}

function memberCheckIn(activityId, payload, user) {
  if (!user || !user.memberId) throw new Error('Vui lòng đăng nhập');
  const raw = getSheetData(SHEET_NAMES.ACTIVITIES).find(a => a.id === activityId);
  if (!raw) throw new Error('Hoạt động không tồn tại');
  if (getActivityStatus(raw.startDate, raw.endDate) !== 'ongoing') {
    throw new Error('Hoạt động không trong thời gian điểm danh');
  }
  if (!isActivityParticipant(activityId, user.memberId)) {
    throw new Error('Bạn chưa đăng ký tham gia hoạt động này');
  }
  if (hasCheckedIn(activityId, user.memberId)) {
    throw new Error('Bạn đã điểm danh hoạt động này');
  }

  const method = payload.method || 'qr';
  let proofImage = '';

  if (method === 'qr') {
    const code = payload.checkInCode;
    if (!code || code !== ensureActivityCheckInCode(activityId)) {
      throw new Error('Mã QR không hợp lệ');
    }
  } else if (method === 'manual') {
    if (!payload.proofBase64) throw new Error('Vui lòng gửi ảnh minh chứng');
    proofImage = uploadAttendanceProof(payload.proofBase64, payload.filename || 'proof.jpg').url;
  } else {
    throw new Error('Phương thức điểm danh không hợp lệ');
  }

  appendRow(SHEET_NAMES.ATTENDANCE, {
    id: generateId('AT'),
    activityId: activityId,
    memberId: user.memberId,
    checkedInAt: formatDateTime(now()),
    checkedInBy: user.id,
    method: method,
    proofImage: proofImage
  });
  logAudit('MEMBER_CHECK_IN', user.memberId + ' at ' + activityId, null);
  return { message: 'Điểm danh thành công', hasCheckedIn: true };
}

function checkIn(activityId, qrCode, user) {
  if (!activityId || !qrCode) throw new Error('Thiếu thông tin điểm danh');
  const members = getSheetData(SHEET_NAMES.MEMBERS);
  const member = members.find(m => m.id === qrCode || m.mssv === qrCode);
  if (!member) throw new Error('Không tìm thấy thành viên');
  if (hasCheckedIn(activityId, member.id)) throw new Error('Đã điểm danh');

  appendRow(SHEET_NAMES.ATTENDANCE, {
    id: generateId('AT'),
    activityId: activityId,
    memberId: member.id,
    checkedInAt: formatDateTime(now()),
    checkedInBy: user.id,
    method: 'admin_scan',
    proofImage: ''
  });
  logAudit('CHECK_IN', member.id + ' at ' + activityId, null);
  return { message: 'Điểm danh thành công: ' + member.name };
}

function getActivityAttendanceList(activityId, user) {
  if (!user || (user.role !== 'admin' && user.role !== 'executive')) {
    throw new Error('Bạn không có quyền xem danh sách điểm danh');
  }
  const activity = getActivity(activityId);
  const attendance = getSheetData(SHEET_NAMES.ATTENDANCE).filter(a => a.activityId === activityId);
  const members = getSheetData(SHEET_NAMES.MEMBERS);
  const participants = getActivityParticipants(activityId);

  const rows = attendance.map((a, idx) => {
    const m = members.find(mem => mem.id === a.memberId) || {};
    return {
      stt: idx + 1,
      memberId: a.memberId,
      name: m.name || '',
      mssv: m.mssv || '',
      school: m.school || '',
      faculty: m.faculty || '',
      phone: m.phone || '',
      checkedInAt: a.checkedInAt,
      method: a.method === 'qr' ? 'Quét QR' : a.method === 'manual' ? 'Ảnh minh chứng' : 'Admin',
      proofImage: a.proofImage || ''
    };
  });

  const checkedIds = new Set(attendance.map(a => a.memberId));
  participants.filter(p => !checkedIds.has(p.memberId)).forEach((p, idx) => {
    rows.push({
      stt: rows.length + 1,
      memberId: p.memberId,
      name: p.name,
      mssv: p.mssv,
      school: p.school,
      faculty: '',
      phone: '',
      checkedInAt: '',
      method: 'Chưa điểm danh',
      proofImage: ''
    });
  });

  return {
    activity: {
      id: activity.id,
      name: activity.name,
      startDate: activity.startDate,
      endDate: activity.endDate,
      location: activity.location
    },
    summary: {
      registered: participants.length,
      checkedIn: attendance.length,
      absent: participants.length - attendance.length
    },
    rows: rows
  };
}

function uploadAttendanceProof(base64, filename) {
  if (!base64) throw new Error('Không có dữ liệu ảnh');
  const folderId = PropertiesService.getScriptProperties().getProperty('AVATAR_FOLDER_ID');
  if (!folderId) throw new Error('Chưa cấu hình AVATAR_FOLDER_ID');
  const mimeType = (filename || '').toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename || 'proof.jpg');
  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: 'https://drive.google.com/uc?id=' + file.getId() };
}
