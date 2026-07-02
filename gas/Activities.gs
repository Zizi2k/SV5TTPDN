/**
 * Quản lý hoạt động
 */

function getActivities(filters) {
  let activities = getSheetData(SHEET_NAMES.ACTIVITIES);

  return activities.map(a => {
    const participants = getSheetData(SHEET_NAMES.ACTIVITY_PARTICIPANTS)
      .filter(p => p.activityId === a.id).length;
    const status = getActivityStatus(a.startDate, a.endDate);
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      startDate: formatDate(a.startDate),
      endDate: formatDate(a.endDate),
      location: a.location,
      image: a.image,
      report: a.report,
      participants: participants,
      status: status
    };
  });
}

function getActivity(id) {
  const activities = getActivities();
  const activity = activities.find(a => a.id === id);
  if (!activity) throw new Error('Không tìm thấy hoạt động');
  return activity;
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

function addActivity(payload, user) {
  const id = generateId('A');
  appendRow(SHEET_NAMES.ACTIVITIES, {
    id: id,
    name: payload.name,
    description: payload.description || '',
    startDate: payload.startDate,
    endDate: payload.endDate,
    location: payload.location || '',
    image: payload.image || '',
    report: '',
    createdBy: user.id,
    createdAt: formatDateTime(now())
  });
  logAudit('ADD_ACTIVITY', id, null);
  return { id, message: 'Đã thêm hoạt động' };
}

function updateActivity(id, payload) {
  const allowed = ['name', 'description', 'startDate', 'endDate', 'location', 'image', 'report'];
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

  const existing = getSheetData(SHEET_NAMES.ACTIVITY_PARTICIPANTS)
    .find(p => p.activityId === activityId && p.memberId === user.memberId);
  if (existing) throw new Error('Bạn đã đăng ký hoạt động này');

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
      joinedAt: p.joinedAt
    };
  });
}

function checkIn(activityId, qrCode, user) {
  if (!activityId || !qrCode) throw new Error('Thiếu thông tin điểm danh');

  const members = getSheetData(SHEET_NAMES.MEMBERS);
  const member = members.find(m => m.id === qrCode || m.mssv === qrCode);
  if (!member) throw new Error('Không tìm thấy thành viên');

  const existing = getSheetData(SHEET_NAMES.ATTENDANCE)
    .find(a => a.activityId === activityId && a.memberId === member.id);
  if (existing) throw new Error('Đã điểm danh');

  appendRow(SHEET_NAMES.ATTENDANCE, {
    id: generateId('AT'),
    activityId: activityId,
    memberId: member.id,
    checkedInAt: formatDateTime(now()),
    checkedInBy: user.id
  });

  logAudit('CHECK_IN', member.id + ' at ' + activityId, null);
  return { message: 'Điểm danh thành công: ' + member.name };
}
