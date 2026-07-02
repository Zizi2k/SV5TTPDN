Pages.register = async function(container) {
  if (Auth.isLoggedIn()) {
    Router.navigate('my-profile');
    return;
  }

  container.innerHTML = `
    <div class="container py-4">
      <div class="text-center mb-4">
        <h2>Đăng ký thành viên</h2>
        <p class="text-muted">Điền đầy đủ thông tin để đăng ký tham gia CLB SV5T</p>
      </div>
      <form id="registerForm">
        <div class="row g-4">
          <div class="col-lg-8 mx-auto">
            <div class="form-section">
              <h5 class="text-primary mb-3"><i class="bi bi-person me-2"></i>Thông tin cá nhân</h5>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Họ và tên <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" name="name" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">MSSV <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" name="mssv" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Trường <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" name="school" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Khoa <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" name="faculty" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Lớp</label>
                  <input type="text" class="form-control" name="className">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Email <span class="text-danger">*</span></label>
                  <input type="email" class="form-control" name="email" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                  <input type="tel" class="form-control" name="phone" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Ngày sinh</label>
                  <input type="date" class="form-control" name="birthday">
                </div>
                <div class="col-md-8">
                  <label class="form-label">Địa chỉ</label>
                  <input type="text" class="form-control" name="address">
                </div>
                <div class="col-12">
                  <label class="form-label">Ảnh đại diện</label>
                  <input type="file" class="form-control" name="avatar" accept="image/*" id="avatarInput">
                  <div class="mt-2 text-center d-none" id="avatarPreview">
                    <img src="" alt="Preview" class="rounded-circle" width="100" height="100" style="object-fit:cover">
                  </div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h5 class="text-primary mb-3"><i class="bi bi-share me-2"></i>Mạng xã hội</h5>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Facebook</label>
                  <input type="url" class="form-control" name="facebook" placeholder="https://facebook.com/...">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Zalo</label>
                  <input type="text" class="form-control" name="zalo" placeholder="Số điện thoại Zalo">
                </div>
              </div>
            </div>

            <div class="form-section">
              <h5 class="text-primary mb-3"><i class="bi bi-heart me-2"></i>Giới thiệu bản thân</h5>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Sở thích</label>
                  <input type="text" class="form-control" name="hobbies" placeholder="VD: Đọc sách, Bóng đá, Tình nguyện (phân cách bằng dấu phẩy)">
                </div>
                <div class="col-12">
                  <label class="form-label">Kỹ năng</label>
                  <input type="text" class="form-control" name="skills" placeholder="VD: MC, Thiết kế, Lập trình">
                </div>
                <div class="col-12">
                  <label class="form-label">Câu nói yêu thích</label>
                  <input type="text" class="form-control" name="quote">
                </div>
                <div class="col-12">
                  <label class="form-label">Lý do tham gia CLB <span class="text-danger">*</span></label>
                  <textarea class="form-control" name="reason" rows="3" required></textarea>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h5 class="text-primary mb-3"><i class="bi bi-shield-lock me-2"></i>Tài khoản</h5>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Mật khẩu <span class="text-danger">*</span></label>
                  <input type="password" class="form-control" name="password" required minlength="6">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Xác nhận mật khẩu <span class="text-danger">*</span></label>
                  <input type="password" class="form-control" name="confirmPassword" required>
                </div>
              </div>
            </div>

            <div class="form-check mb-4">
              <input class="form-check-input" type="checkbox" id="agreeTerms" required>
              <label class="form-check-label" for="agreeTerms">
                Tôi đồng ý với quy định và cam kết tham gia tích cực các hoạt động CLB
              </label>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-100 py-3">
              <i class="bi bi-send me-2"></i>Gửi đăng ký
            </button>
            <p class="text-center text-muted mt-3">
              Đã có tài khoản? <a href="#login">Đăng nhập</a>
            </p>
          </div>
        </div>
      </form>
    </div>
  `;

  document.getElementById('avatarInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('avatarPreview');
        preview.classList.remove('d-none');
        preview.querySelector('img').src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));

    if (data.password !== data.confirmPassword) {
      Utils.showToast('Mật khẩu xác nhận không khớp', 'danger');
      return;
    }
    if (!Utils.validateEmail(data.email)) {
      Utils.showToast('Email không hợp lệ', 'danger');
      return;
    }

    const avatarFile = form.querySelector('[name="avatar"]').files[0];
    if (avatarFile) {
      const base64 = await fileToBase64(avatarFile);
      data.avatarBase64 = base64;
      data.avatarFilename = avatarFile.name;
    }
    delete data.confirmPassword;
    delete data.avatar;

    try {
      await API.register(data);
      Utils.showToast('Đăng ký thành công! Vui lòng chờ phê duyệt.', 'success');
      Router.navigate('login');
    } catch (err) {
      // handled
    }
  });
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
