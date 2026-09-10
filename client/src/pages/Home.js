import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, userType } = useAuth();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await customerAPI.getServices();
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dịch vụ:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <section id="home" className="hero-section">
        <div className="container">
          <div className="row align-items-center g-5">
            {/* Left Column - Content */}
            <div className="col-lg-6">
              <div className="hero-content">
                <div className="hero-badge">
                  Dịch vụ dọn dẹp chuyên nghiệp
                </div>

                <h1 className="hero-title">
                  Ngôi Nhà Sạch Sẽ, <br />
                  Cuộc Sống Thoải Mái
                </h1>

                <p className="hero-description">
                  Chúng tôi mang đến dịch vụ dọn dẹp nhà cửa chuyên nghiệp,
                  giúp không gian sống của bạn luôn sạch sẽ, gọn gàng và thoải mái.
                  Đội ngũ nhân viên được đào tạo bài bản, tận tâm với công việc.
                </p>

                <div className="hero-features">
                  <div className="feature-item">
                    <span className="feature-icon">✓</span>
                    <span className="feature-text">Nhân viên chuyên nghiệp, có kinh nghiệm</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">✓</span>
                    <span className="feature-text">Thiết bị và hóa chất an toàn, thân thiện môi trường</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">✓</span>
                    <span className="feature-text">Giá cả hợp lý, minh bạch</span>
                  </div>
                </div>

                {!isAuthenticated ? (
                  <div className="hero-buttons">
                    <a href="/customer/register" className="btn btn-primary btn-lg">
                      Đặt lịch ngay
                    </a>
                    <a href="#services" className="btn btn-outline-primary btn-lg">
                      Xem bảng giá
                    </a>
                  </div>
                ) : userType === 'customer' ? (
                  <div className="hero-buttons">
                    <Link to="/customer/book-service" className="btn btn-primary btn-lg">
                      Đặt lịch ngay
                    </Link>
                    <Link to="/customer/services" className="btn btn-outline-primary btn-lg">
                      Xem dịch vụ
                    </Link>
                  </div>
                ) : null}

                <div className="hero-stats">
                  <div className="stat-item">
                    <div className="stat-number">5000+</div>
                    <div className="stat-label">Khách hàng</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">4.9/5</div>
                    <div className="stat-label">Đánh giá</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">10+</div>
                    <div className="stat-label">Năm kinh nghiệm</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="col-lg-6">
              <div className="hero-image-wrapper">
                <div className="hero-image">
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
                    alt="Clean modern home"
                    className="img-fluid"
                  />
                </div>
                <div className="hero-badge-float">
                  <div className="badge-float-icon">
                    <span>✓</span>
                  </div>
                  <div className="badge-float-content">
                    <div className="badge-float-title">Đảm bảo chất lượng</div>
                    <div className="badge-float-subtitle">100% hài lòng</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="services-section">
        <h2 className="section-title">Dịch Vụ Của Chúng Tôi</h2>
        {loading ? (
          <div className="loading">Đang tải dịch vụ...</div>
        ) : (
          <div className="services-grid">
            {services.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-icon">🧹</div>
                <h3 className="service-name">{service.serviceName}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-details">
                  <div className="service-price">
                    <span className="label">Giá:</span>
                    <span className="value">{service.basicPrice?.toLocaleString()} VNĐ/m²</span>
                  </div>
                  <div className="service-duration">
                    <span className="label">Thời gian:</span>
                    <span className="value">{service.duration} phút</span>
                  </div>
                </div>
                {isAuthenticated && userType === 'customer' && (
                  <Link
                    to={`/customer/book-service?serviceId=${service.id}`}
                    className="btn btn-book"
                  >
                    Đặt lịch ngay
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="features-section">
        <div className="container">
          <div className="row align-items-center g-5">
            {/* Image Column - Left on desktop, Bottom on mobile */}
            <div className="col-lg-6 order-2 order-lg-1">
              <div className="features-image-wrapper">
                <div className="features-image">
                  <img
                    src="/images/cleaning-homepage-pic.jpg"
                    alt="Professional cleaning"
                    className="img-fluid"
                  />
                </div>
                <div className="features-badge-float">
                  <div className="badge-stat-number">98%</div>
                  <div className="badge-stat-label">Khách hàng hài lòng</div>
                </div>
              </div>
            </div>

            {/* Content Column - Right on desktop, Top on mobile */}
            <div className="col-lg-6 order-1 order-lg-2">
              <div className="features-content">
                <div className="section-badge">
                  Tại sao chọn chúng tôi
                </div>

                <h2 className="features-title">
                  Cam Kết Mang Đến Dịch Vụ Tốt Nhất
                </h2>

                <p className="features-description">
                  Với hơn 10 năm kinh nghiệm trong lĩnh vực dọn dẹp nhà cửa,
                  chúng tôi tự hào là đơn vị hàng đầu được khách hàng tin tưởng và lựa chọn.
                </p>

                <div className="features-grid">
                  <div className="feature-item">

                    <div className="feature-content">
                      <h3 className="feature-title">Chất Lượng Cao</h3>
                      <p className="feature-text">Đội ngũ nhân viên chuyên nghiệp</p>
                    </div>
                  </div>

                  <div className="feature-item">

                    <div className="feature-content">
                      <h3 className="feature-title">Nhanh Chóng</h3>
                      <p className="feature-text">Đặt lịch dễ dàng, phục vụ nhanh chóng</p>
                    </div>
                  </div>

                  <div className="feature-item">

                    <div className="feature-content">
                      <h3 className="feature-title">Giá Cả Hợp Lý</h3>
                      <p className="feature-text">Mức giá cạnh tranh, phù hợp với mọi gia đình</p>
                    </div>
                  </div>

                  <div className="feature-item">

                    <div className="feature-content">
                      <h3 className="feature-title">An Toàn</h3>
                      <p className="feature-text">Cam kết bảo mật thông tin và an toàn tài sản</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <h2 className="section-title">Về Chúng Tôi</h2>
        <div className="about-content">
          <div className="about-text">
            <h3>No Dirt - Đối Tác Tin Cậy Cho Ngôi Nhà Của Bạn</h3>
            <p>
              Chúng tôi là nền tảng kết nối khách hàng với các công ty dọn dẹp
              chuyên nghiệp hàng đầu tại Việt Nam. Với hơn 5 năm kinh nghiệm,
              chúng tôi cam kết mang đến dịch vụ tốt nhất cho khách hàng.
            </p>
            <p>
              Đội ngũ của chúng tôi được đào tạo bài bản, sử dụng thiết bị
              hiện đại và hóa chất thân thiện với môi trường để đảm bảo an toàn
              cho gia đình bạn.
            </p>
            <div className="about-stats">
              <div className="stat-item">
                <div className="stat-number">1000+</div>
                <div className="stat-label">Khách hàng hài lòng</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Nhân viên chuyên nghiệp</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5+</div>
                <div className="stat-label">Năm kinh nghiệm</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <h2 className="section-title">Liên Hệ Với Chúng Tôi</h2>
        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">
                <img src="/images/house-cleaning-logo.jpg" alt="Location" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              </div>
              <div>
                <h4>Địa chỉ</h4>
                <p>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <img src="/images/phone.webp" alt="Location" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              </div>
              <div>
                <h4>Điện thoại</h4>
                <p>1900 1234</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <img src="/images/email.webp" alt="Location" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              </div>
              <div>
                <h4>Email</h4>
                <p>contact@nodirt.vn</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <img src="/images/working-time.jpg" alt="Location" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              </div>
              <div>
                <h4>Giờ làm việc</h4>
                <p>Thứ 2 - Chủ nhật: 7:00 - 20:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;


