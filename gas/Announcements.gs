/**
 * Quản lý thông báo
 */

function getAnnouncements(filters) {
  let items = getSheetData(SHEET_NAMES.ANNOUNCEMENTS)
    .filter(a => a.hidden !== true && a.hidden !== 'TRUE');

  const users = getSheetData(SHEET_NAMES.USERS);

  return items.map(a => {
    const author = users.find(u => u.id === a.authorId);
    return {
      id: a.id,
      title: a.title,
      content: a.content,
      author: author ? author.name : a.authorName || 'Ban Chủ nhiệm',
      createdAt: a.createdAt,
      pinned: a.pinned === true || a.pinned === 'TRUE',
      important: a.important === true || a.important === 'TRUE'
    };
  }).sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function addAnnouncement(payload, user) {
  const id = generateId('N');
  appendRow(SHEET_NAMES.ANNOUNCEMENTS, {
    id: id,
    title: payload.title,
    content: payload.content,
    authorId: user.id,
    authorName: user.name,
    createdAt: formatDateTime(now()),
    pinned: payload.pinned || false,
    important: payload.important || false,
    hidden: false
  });
  logAudit('ADD_ANNOUNCEMENT', id, null);
  return { id, message: 'Đã đăng thông báo' };
}

function updateAnnouncement(id, payload) {
  const allowed = ['title', 'content', 'pinned', 'important', 'hidden'];
  const updates = {};
  allowed.forEach(f => { if (payload[f] !== undefined) updates[f] = payload[f]; });
  updateRow(SHEET_NAMES.ANNOUNCEMENTS, id, updates);
  logAudit('UPDATE_ANNOUNCEMENT', id, null);
  return { message: 'Cập nhật thành công' };
}

function deleteAnnouncement(id) {
  updateRow(SHEET_NAMES.ANNOUNCEMENTS, id, { hidden: true });
  logAudit('DELETE_ANNOUNCEMENT', id, null);
  return { message: 'Đã ẩn thông báo' };
}

function togglePinAnnouncement(id) {
  const found = findRowById(SHEET_NAMES.ANNOUNCEMENTS, id);
  if (!found) throw new Error('Không tìm thấy');
  const current = found.data[found.headers.indexOf('pinned')];
  const newVal = !(current === true || current === 'TRUE');
  updateRow(SHEET_NAMES.ANNOUNCEMENTS, id, { pinned: newVal });
  return { pinned: newVal };
}
