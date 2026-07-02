/**
 * Quản lý thành viên
 */

function getMembers(filters) {
  let members = getSheetData(SHEET_NAMES.MEMBERS).filter(m => m.status === 'active');

  if (filters.school) members = members.filter(m => m.school === filters.school);
  if (filters.faculty) members = members.filter(m => m.faculty === filters.faculty);
  if (filters.cohort) members = members.filter(m => m.cohort === filters.cohort);
  if (filters.role) members = members.filter(m => m.role === filters.role);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    members = members.filter(m =>
      [m.name, m.email, m.mssv, m.id].some(v => String(v).toLowerCase().includes(s))
    );
  }

  return members.map(sanitizeMember);
}

function getMember(id) {
  const members = getSheetData(SHEET_NAMES.MEMBERS);
  const member = members.find(m => m.id === id);
  if (!member) throw new Error('Không tìm thấy thành viên');

  const scores = getSheetData(SHEET_NAMES.SCORES).filter(s => s.memberId === id);
  const totalScore = scores.reduce((sum, s) => sum + Number(s.score || 0), 0);

  return { ...sanitizeMember(member), totalScore };
}

function sanitizeMember(m) {
  return {
    id: m.id,
    name: m.name,
    mssv: m.mssv,
    school: m.school,
    faculty: m.faculty,
    className: m.className,
    cohort: m.cohort,
    email: m.email,
    phone: m.phone,
    birthday: formatDate(m.birthday),
    address: m.address,
    avatar: m.avatar,
    facebook: m.facebook,
    zalo: m.zalo,
    hobbies: m.hobbies,
    skills: m.skills,
    quote: m.quote,
    reason: m.reason,
    bio: m.bio,
    role: m.role,
    joinDate: formatDate(m.joinDate),
    totalScore: Number(m.totalScore) || 0,
    titles: m.titles,
    status: m.status
  };
}

function addMember(payload) {
  const userId = generateId('U');
  const memberId = generateId('M');

  appendRow(SHEET_NAMES.USERS, {
    id: userId,
    memberId: memberId,
    email: payload.email,
    mssv: payload.mssv || '',
    password: hashPassword(payload.password || 'sv5t123'),
    role: payload.userRole || 'member',
    status: 'active',
    name: payload.name,
    createdAt: formatDateTime(now())
  });

  appendRow(SHEET_NAMES.MEMBERS, {
    id: memberId,
    userId: userId,
    name: payload.name,
    mssv: payload.mssv || '',
    school: payload.school || '',
    faculty: payload.faculty || '',
    className: payload.className || '',
    email: payload.email,
    phone: payload.phone || '',
    birthday: payload.birthday || '',
    address: payload.address || '',
    avatar: payload.avatar || '',
    facebook: payload.facebook || '',
    zalo: payload.zalo || '',
    hobbies: payload.hobbies || '',
    skills: payload.skills || '',
    quote: payload.quote || '',
    reason: payload.reason || '',
    bio: payload.bio || '',
    role: payload.role || 'Thành viên',
    cohort: payload.cohort || '',
    status: 'active',
    joinDate: formatDate(now()),
    totalScore: 0,
    titles: ''
  });

  logAudit('ADD_MEMBER', memberId, null);
  return { id: memberId, message: 'Đã thêm thành viên' };
}

function updateMember(id, payload) {
  const allowed = ['name', 'school', 'faculty', 'className', 'email', 'phone', 'birthday', 'address',
    'facebook', 'zalo', 'hobbies', 'skills', 'quote', 'bio', 'role', 'cohort', 'titles'];
  const updates = {};
  allowed.forEach(f => { if (payload[f] !== undefined) updates[f] = payload[f]; });
  updateRow(SHEET_NAMES.MEMBERS, id, updates);
  logAudit('UPDATE_MEMBER', id, null);
  return { message: 'Cập nhật thành công' };
}

function deleteMember(id) {
  const users = getSheetData(SHEET_NAMES.USERS);
  const user = users.find(u => u.memberId === id);
  if (user) deleteRow(SHEET_NAMES.USERS, user.id);
  deleteRow(SHEET_NAMES.MEMBERS, id);
  logAudit('DELETE_MEMBER', id, null);
  return { message: 'Đã xóa thành viên' };
}

function getPendingMembers() {
  const users = getSheetData(SHEET_NAMES.USERS).filter(u => u.status === 'pending');
  const members = getSheetData(SHEET_NAMES.MEMBERS);

  return users.map(u => {
    const m = members.find(mem => mem.userId === u.id) || {};
    return {
      id: m.id || u.memberId,
      name: u.name,
      mssv: u.mssv,
      school: m.school || '',
      email: u.email,
      registeredAt: u.createdAt
    };
  });
}

function getScores(memberId) {
  const scores = getSheetData(SHEET_NAMES.SCORES).filter(s => s.memberId === memberId);
  const items = scores.map(s => ({
    activity: s.activityName,
    score: Number(s.score),
    date: formatDate(s.date)
  }));
  const total = items.reduce((sum, s) => sum + s.score, 0);
  return { items, total };
}

function addScore(payload, user) {
  const { memberId, activity, score } = payload;
  if (!memberId || !activity || !score) throw new Error('Thiếu thông tin');

  appendRow(SHEET_NAMES.SCORES, {
    id: generateId('S'),
    memberId: memberId,
    activityName: activity,
    score: Number(score),
    date: formatDate(now()),
    addedBy: user.id
  });

  const scores = getSheetData(SHEET_NAMES.SCORES).filter(s => s.memberId === memberId);
  const total = scores.reduce((sum, s) => sum + Number(s.score || 0), 0);
  updateRow(SHEET_NAMES.MEMBERS, memberId, { totalScore: total });

  logAudit('ADD_SCORE', memberId + ': ' + score, null);
  return { message: 'Đã cộng điểm', total };
}

function getExecutiveBoard() {
  return getSheetData(SHEET_NAMES.EXECUTIVE_BOARD)
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map(e => ({
      id: e.id,
      name: e.name,
      position: e.position,
      avatar: e.avatar,
      bio: e.bio,
      email: e.email,
      phone: e.phone,
      order: Number(e.order)
    }));
}

function updateExecutiveBoard(payload) {
  if (payload.members && Array.isArray(payload.members)) {
    payload.members.forEach(m => {
      if (m.id) updateRow(SHEET_NAMES.EXECUTIVE_BOARD, m.id, m);
    });
  }
  logAudit('UPDATE_EXECUTIVE', 'board updated', null);
  return { message: 'Cập nhật Ban Chủ nhiệm thành công' };
}
