Pages.executiveBoard = async function(container) {
  const board = await API.getExecutiveBoard();
  board.sort((a, b) => (a.order || 0) - (b.order || 0));

  const chairman = board.filter(b => b.position.includes('Chủ nhiệm') && !b.position.includes('Phó'));
  const viceChairman = board.filter(b => b.position.includes('Phó Chủ nhiệm'));
  const others = board.filter(b => !chairman.includes(b) && !viceChairman.includes(b));

  container.innerHTML = `
    <div class="container py-4">
      <h2 class="section-title text-center">Ban Chủ nhiệm CLB</h2>
      <p class="text-center text-muted mb-5">Đội ngũ lãnh đạo CLB Sinh viên 5 Tốt Thành phố Đồng Nai</p>

      ${chairman.length ? `
        <div class="row justify-content-center mb-4">
          ${chairman.map(m => renderExecCard(m, 'col-md-4')).join('')}
        </div>
      ` : ''}

      ${viceChairman.length ? `
        <div class="row justify-content-center mb-4">
          ${viceChairman.map(m => renderExecCard(m, 'col-md-4')).join('')}
        </div>
      ` : ''}

      ${others.length ? `
        <div class="row g-4 justify-content-center">
          ${others.map(m => renderExecCard(m, 'col-md-4 col-lg-3')).join('')}
        </div>
      ` : ''}
    </div>
  `;
};

function renderExecCard(m, colClass) {
  return `
    <div class="${colClass}">
      <div class="card exec-card h-100">
        <img src="${Utils.avatarUrl(m.avatar, m.name)}" alt="${Utils.escapeHtml(m.name)}" class="avatar">
        <h5 class="mb-1">${Utils.escapeHtml(m.name)}</h5>
        <p class="position">${Utils.escapeHtml(m.position)}</p>
        <p class="text-muted small">${Utils.escapeHtml(m.bio || '')}</p>
        <div class="mt-auto">
          ${m.email ? `<a href="mailto:${Utils.escapeHtml(m.email)}" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-envelope"></i></a>` : ''}
          ${m.phone ? `<a href="tel:${Utils.escapeHtml(m.phone)}" class="btn btn-sm btn-outline-primary"><i class="bi bi-telephone"></i></a>` : ''}
        </div>
      </div>
    </div>
  `;
}
