Pages.contact = async function(container) {
  container.innerHTML = `
    <div class="container py-4">
      <h2 class="section-title">Liên hệ</h2>
      <div class="row g-4">
        <div class="col-lg-5">
          <div class="card h-100">
            <div class="card-body p-4">
              <h5 class="text-primary mb-4">Thông tin liên hệ</h5>
              <div class="mb-3">
                <i class="bi bi-building text-primary me-2"></i>
                <strong>${CONFIG.CLUB_NAME}</strong>
              </div>
              <div class="mb-3">
                <i class="bi bi-geo-alt text-primary me-2"></i>
                Thành phố Biên Hòa, Tỉnh Đồng Nai
              </div>
              <div class="mb-3">
                <i class="bi bi-envelope text-primary me-2"></i>
                <a href="mailto:clbsv5t.dongnai@gmail.com">clbsv5t.dongnai@gmail.com</a>
              </div>
              <div class="mb-3">
                <i class="bi bi-facebook text-primary me-2"></i>
                <a href="#" target="_blank">CLB SV5T Đồng Nai</a>
              </div>
              <div class="mb-3">
                <i class="bi bi-telephone text-primary me-2"></i>
                0901 234 567
              </div>
              <hr>
              <h6 class="text-primary">Giờ hoạt động</h6>
              <p class="text-muted mb-0">Thứ 2 - Thứ 6: 8:00 - 17:00<br>Thứ 7: 8:00 - 12:00</p>
            </div>
          </div>
        </div>
        <div class="col-lg-7">
          <div class="card h-100">
            <div class="card-body p-4">
              <h5 class="text-primary mb-4">Gửi tin nhắn</h5>
              <form id="contactForm">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Họ và tên</label>
                    <input type="text" class="form-control" name="name" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" name="email" required>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Tiêu đề</label>
                    <input type="text" class="form-control" name="subject" required>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Nội dung</label>
                    <textarea class="form-control" name="message" rows="5" required></textarea>
                  </div>
                  <div class="col-12">
                    <button type="submit" class="btn btn-primary px-4">
                      <i class="bi bi-send me-2"></i>Gửi tin nhắn
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    Utils.showToast('Cảm ơn bạn! Tin nhắn đã được gửi.', 'success');
    e.target.reset();
  });
};
