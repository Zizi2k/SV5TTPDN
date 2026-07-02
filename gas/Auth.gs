/**
 * Xác thực và quản lý phiên
 */

function authLogin(identifier, password) {
  if (!identifier || !password) throw new Error('Vui lòng nhập đầy đủ thông tin');

  const users = getSheetData(SHEET_NAMES.USERS);
  const user = users.find(u =>
    (u.email === identifier || u.mssv === identifier) &&
    u.status === 'active'
  );

  if (!user) throw new Error('Email/MSSV hoặc mật khẩu không đúng');

  const hashed = hashPassword(password);
  if (user.password !== hashed) throw new Error('Email/MSSV hoặc mật khẩu không đúng');

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  appendRow(SHEET_NAMES.SESSIONS, {
    token: token,
    userId: user.id,
    createdAt: formatDateTime(now()),
    expiresAt: formatDateTime(expiresAt)
  });

  logAudit('LOGIN', user.email, token);

  return {
    token: token,
    user: sanitizeUser(user)
  };
}

function authRegister(payload) {
  const required = ['name', 'mssv', 'school', 'faculty', 'email', 'phone', 'password', 'reason'];
  for (const field of required) {
    if (!payload[field]) throw new Error('Vui lòng điền đầy đủ: ' + field);
  }

  const users = getSheetData(SHEET_NAMES.USERS);
  if (users.find(u => u.email === payload.email)) {
    throw new Error('Email đã được đăng ký');
  }
  if (users.find(u => u.mssv === payload.mssv)) {
    throw new Error('MSSV đã được đăng ký');
  }

  const userId = generateId('U');
  const memberId = generateId('M');

  appendRow(SHEET_NAMES.USERS, {
    id: userId,
    memberId: memberId,
    email: payload.email,
    mssv: payload.mssv,
    password: hashPassword(payload.password),
    role: 'member',
    status: 'pending',
    name: payload.name,
    createdAt: formatDateTime(now())
  });

  let avatarUrl = '';
  if (payload.avatarBase64) {
    try {
      const result = uploadAvatar(payload.avatarBase64, payload.avatarFilename, { id: userId, memberId: memberId });
      avatarUrl = result.url;
    } catch (e) { /* avatar optional */ }
  }

  appendRow(SHEET_NAMES.MEMBERS, {
    id: memberId,
    userId: userId,
    name: payload.name,
    mssv: payload.mssv,
    school: payload.school,
    faculty: payload.faculty,
    className: payload.className || '',
    email: payload.email,
    phone: payload.phone,
    birthday: payload.birthday || '',
    address: payload.address || '',
    avatar: avatarUrl,
    facebook: payload.facebook || '',
    zalo: payload.zalo || '',
    hobbies: payload.hobbies || '',
    skills: payload.skills || '',
    quote: payload.quote || '',
    reason: payload.reason,
    bio: '',
    role: 'Thành viên',
    cohort: '',
    status: 'pending',
    joinDate: '',
    totalScore: 0,
    titles: ''
  });

  logAudit('REGISTER', payload.email, null);

  try {
    sendApprovalEmail(payload.email, payload.name);
  } catch (e) { /* email optional */ }

  return { message: 'Đăng ký thành công! Vui lòng chờ Ban Chủ nhiệm phê duyệt.' };
}

function authLogout(token) {
  if (!token) return { message: 'OK' };
  const found = findRowById(SHEET_NAMES.SESSIONS, token, 'token');
  if (found) found.sheet.deleteRow(found.row);
  logAudit('LOGOUT', token, token);
  return { message: 'Đã đăng xuất' };
}

function validateToken(token) {
  if (!token) {
    const err = new Error('Chưa đăng nhập');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const sessions = getSheetData(SHEET_NAMES.SESSIONS);
  const session = sessions.find(s => s.token === token);
  if (!session) {
    const err = new Error('Phiên đăng nhập hết hạn');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const expiresAt = new Date(session.expiresAt);
  if (expiresAt < now()) {
    deleteRow(SHEET_NAMES.SESSIONS, token, 'token');
    const err = new Error('Phiên đăng nhập hết hạn');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const users = getSheetData(SHEET_NAMES.USERS);
  const user = users.find(u => u.id === session.userId);
  if (!user || user.status !== 'active') {
    const err = new Error('Tài khoản không hợp lệ');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  return sanitizeUser(user);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    memberId: user.memberId,
    name: user.name,
    email: user.email,
    mssv: user.mssv,
    role: user.role
  };
}

function getProfile(user) {
  const member = getSheetData(SHEET_NAMES.MEMBERS).find(m => m.id === user.memberId);
  return { user, member };
}

function updateProfile(user, payload) {
  const allowed = ['phone', 'address', 'facebook', 'zalo', 'hobbies', 'skills', 'quote', 'bio'];
  const updates = {};
  allowed.forEach(f => { if (payload[f] !== undefined) updates[f] = payload[f]; });
  updateRow(SHEET_NAMES.MEMBERS, user.memberId, updates);
  logAudit('UPDATE_PROFILE', user.memberId, null);
  return { message: 'Cập nhật thành công' };
}

function approveMember(id, approver) {
  const users = getSheetData(SHEET_NAMES.USERS);
  const user = users.find(u => u.memberId === id || u.id === id);
  if (!user) throw new Error('Không tìm thấy thành viên');

  updateRow(SHEET_NAMES.USERS, user.id, { status: 'active' });
  updateRow(SHEET_NAMES.MEMBERS, user.memberId, {
    status: 'active',
    joinDate: formatDate(now())
  });

  logAudit('APPROVE_MEMBER', user.memberId, null);

  try {
    sendApprovedEmail(user.email, user.name);
  } catch (e) { /* optional */ }

  return { message: 'Đã duyệt thành viên' };
}

function lockMember(id) {
  const users = getSheetData(SHEET_NAMES.USERS);
  const user = users.find(u => u.memberId === id || u.id === id);
  if (!user) throw new Error('Không tìm thấy');

  updateRow(SHEET_NAMES.USERS, user.id, { status: 'locked' });
  updateRow(SHEET_NAMES.MEMBERS, user.memberId, { status: 'locked' });
  logAudit('LOCK_MEMBER', id, null);
  return { message: 'Đã khóa tài khoản' };
}

function resetPassword(id) {
  const users = getSheetData(SHEET_NAMES.USERS);
  const user = users.find(u => u.memberId === id || u.id === id);
  if (!user) throw new Error('Không tìm thấy');

  const newPassword = 'sv5t' + Math.random().toString(36).substring(2, 8);
  updateRow(SHEET_NAMES.USERS, user.id, { password: hashPassword(newPassword) });
  logAudit('RESET_PASSWORD', id, null);

  try {
    MailApp.sendEmail(user.email, 'Reset mật khẩu CLB SV5T', 'Mật khẩu mới của bạn: ' + newPassword);
  } catch (e) { /* optional */ }

  return { message: 'Đã reset mật khẩu' };
}

function sendApprovalEmail(email, name) {
  const admins = getSheetData(SHEET_NAMES.USERS).filter(u => u.role === 'admin' || u.role === 'executive');
  const adminEmails = admins.map(a => a.email).join(',');
  if (adminEmails) {
    MailApp.sendEmail(adminEmails, 'Đăng ký mới - CLB SV5T', name + ' (' + email + ') vừa đăng ký tham gia CLB. Vui lòng duyệt tài khoản.');
  }
}

function sendApprovedEmail(email, name) {
  MailApp.sendEmail(email, 'Tài khoản đã được duyệt - CLB SV5T',
    'Xin chào ' + name + ',\n\nTài khoản của bạn đã được phê duyệt. Bạn có thể đăng nhập và tham gia các hoạt động CLB.\n\nTrân trọng,\nCLB SV5T TP. Đồng Nai');
}
