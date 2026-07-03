Pages.members = async function(container) {
  const members = await API.getMembers();

  const schools = [...new Set(members.map(m => m.school).filter(Boolean))];
  const faculties = [...new Set(members.map(m => m.faculty).filter(Boolean))];
  const cohorts = [...new Set(members.map(m => m.cohort).filter(Boolean))];
  const roles = [...new Set(members.map(m => m.role).filter(Boolean))];

  container.innerHTML = `
    <div class="container py-4">
      <h2 class="section-title">Danh sách thành viên</h2>

      <div class="filter-bar">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label small">Tìm kiếm</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="memberSearch" placeholder="Tên, email, MSSV...">
            </div>
          </div>
          <div class="col-md-2">
            <label class="form-label small">Trường</label>
            <select class="form-select" id="filterSchool">
              <option value="">Tất cả</option>
              ${schools.map(s => `<option value="${Utils.escapeHtml(s)}">${Utils.escapeHtml(s)}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small">Khoa</label>
            <select class="form-select" id="filterFaculty">
              <option value="">Tất cả</option>
              ${faculties.map(f => `<option value="${Utils.escapeHtml(f)}">${Utils.escapeHtml(f)}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small">Khóa</label>
            <select class="form-select" id="filterCohort">
              <option value="">Tất cả</option>
              ${cohorts.map(c => `<option value="${Utils.escapeHtml(c)}">${Utils.escapeHtml(c)}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small">Vai trò</label>
            <select class="form-select" id="filterRole">
              <option value="">Tất cả</option>
              ${roles.map(r => `<option value="${Utils.escapeHtml(r)}">${Utils.escapeHtml(r)}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="text-muted" id="memberCount">${members.length} thành viên</span>
        ${Auth.isExecutive() ? `<button class="btn btn-sm btn-outline-primary" id="exportMembers"><i class="bi bi-download me-1"></i>Xuất Excel</button>` : ''}
      </div>

      <div class="row g-4" id="memberGrid">
        ${members.map(m => Pages.renderMemberCard(m)).join('')}
      </div>
      <div id="noResults" class="empty-state d-none">
        <i class="bi bi-search"></i>
        <p>Không tìm thấy thành viên phù hợp</p>
      </div>
    </div>
  `;

  let allMembers = members;

  function filterMembers() {
    const search = document.getElementById('memberSearch').value.toLowerCase();
    const school = document.getElementById('filterSchool').value;
    const faculty = document.getElementById('filterFaculty').value;
    const cohort = document.getElementById('filterCohort').value;
    const role = document.getElementById('filterRole').value;

    const filtered = allMembers.filter(m => {
      const matchSearch = !search || [m.name, m.email, m.id, m.mssv].some(v => (v || '').toLowerCase().includes(search));
      const matchSchool = !school || m.school === school;
      const matchFaculty = !faculty || m.faculty === faculty;
      const matchCohort = !cohort || m.cohort === cohort;
      const matchRole = !role || m.role === role;
      return matchSearch && matchSchool && matchFaculty && matchCohort && matchRole;
    });

    document.getElementById('memberGrid').innerHTML = filtered.map(m => Pages.renderMemberCard(m)).join('');
    document.getElementById('memberCount').textContent = `${filtered.length} thành viên`;
    document.getElementById('noResults').classList.toggle('d-none', filtered.length > 0);
    document.getElementById('memberGrid').classList.toggle('d-none', filtered.length === 0);
  }

  document.getElementById('memberSearch').addEventListener('input', Utils.debounce(filterMembers));
  ['filterSchool', 'filterFaculty', 'filterCohort', 'filterRole'].forEach(id => {
    document.getElementById(id).addEventListener('change', filterMembers);
  });

  document.getElementById('exportMembers')?.addEventListener('click', async () => {
    await Utils.exportToExcel(allMembers.map(m => ({
      id: m.id,
      name: m.name,
      mssv: m.mssv || '',
      email: m.email || '',
      phone: m.phone || '',
      role: m.role || '',
      school: m.school || '',
      faculty: m.faculty || '',
      cohort: m.cohort || ''
    })), 'danh-sach-thanh-vien.xlsx', {
      sheetName: 'Thành viên',
      title: 'Danh sách thành viên CLB SV5T',
      columns: [
        { header: 'Mã', key: 'id' },
        { header: 'Họ tên', key: 'name' },
        { header: 'MSSV', key: 'mssv' },
        { header: 'Email', key: 'email' },
        { header: 'SĐT', key: 'phone' },
        { header: 'Vai trò', key: 'role' },
        { header: 'Trường', key: 'school' },
        { header: 'Khoa', key: 'faculty' },
        { header: 'Khóa', key: 'cohort' }
      ]
    });
    Utils.showToast('Đã xuất file Excel', 'success');
  });
};
