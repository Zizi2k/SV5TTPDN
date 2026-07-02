Pages.login = async function(container) {
  if (Auth.isLoggedIn()) {
    Auth.redirectAfterLogin(Auth.getUser());
    return;
  }

  container.innerHTML = `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-5">
          <div class="form-section">
            <div class="text-center mb-4">
              <img src="assets/img/logo.svg" alt="Logo" width="64" height="64">
              <h3 class="mt-3">Đăng nhập</h3>
              <p class="text-muted">Đăng nhập vào hệ thống CLB SV5T</p>
            </div>
            <form id="loginForm">
              <div class="mb-3">
                <label class="form-label">Email hoặc MSSV</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-person"></i></span>
                  <input type="text" class="form-control" id="loginIdentifier" required placeholder="Nhập email hoặc MSSV">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Mật khẩu</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-lock"></i></span>
                  <input type="password" class="form-control" id="loginPassword" required placeholder="Nhập mật khẩu">
                  <button class="btn btn-outline-secondary" type="button" id="togglePassword"><i class="bi bi-eye"></i></button>
                </div>
              </div>
              <button type="submit" class="btn btn-primary w-100 py-2 mb-3">
                <i class="bi bi-box-arrow-in-right me-2"></i>Đăng nhập
              </button>
              <p class="text-center text-muted mb-0">
                Chưa có tài khoản? <a href="#register">Đăng ký ngay</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('togglePassword').addEventListener('click', () => {
    const input = document.getElementById('loginPassword');
    const icon = document.querySelector('#togglePassword i');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.className = input.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
  });

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
      const user = await Auth.login(identifier, password);
      Utils.showToast('Đăng nhập thành công!', 'success');
      Auth.redirectAfterLogin(user);
    } catch (err) {
      // Error handled by API
    }
  });
};
