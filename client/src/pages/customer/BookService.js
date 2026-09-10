import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Customer.css';

const BookService = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    id_service: searchParams.get('serviceId') || '',
    booking_day: '',
    cleaning_time: '',
    address: user?.address || '',
    home_size_sqm: '',
    note: '',
    special_instructions: '',
    booking_type: 'one_time',
    payment_method: 'cash',
  });
  const [serviceProfile, setServiceProfile] = useState(null);

  // State riêng cho hiển thị ngày (dd/mm/yyyy)
  const [dateDisplay, setDateDisplay] = useState('');

  useEffect(() => {
    loadServices();
    loadServiceProfile();
  }, []);

  const loadServices = async () => {
    try {
      const response = await customerAPI.getServices();
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dịch vụ:', error);
    }
  };

  const loadServiceProfile = async () => {
    try {
      const response = await customerAPI.getServiceProfile();
      if (response.data.success && response.data.data) {
        const profile = response.data.data;
        setServiceProfile(profile);
        setFormData((prev) => ({
          ...prev,
          address: prev.address || profile.defaultAddress || '',
          cleaning_time: prev.cleaning_time || (profile.defaultTime ? profile.defaultTime.slice(0, 5) : ''),
          special_instructions: profile.specialInstructions || '',
          // Điền sẵn diện tích từ hồ sơ nếu có
          home_size_sqm: prev.home_size_sqm || (profile.homeSizeSqm ? String(profile.homeSizeSqm) : ''),
        }));
      }
    } catch (error) {
      console.error('Lỗi khi tải hồ sơ dịch vụ:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Handler đặc biệt cho date input với format dd/mm/yyyy
  const handleDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Chỉ giữ số

    // Tự động thêm dấu /
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5);
    }
    // Giới hạn độ dài
    value = value.slice(0, 10);

    setDateDisplay(value);

    // Convert sang yyyy-mm-dd cho formData khi đủ 10 ký tự
    if (value.length === 10) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        setFormData(prev => ({ ...prev, booking_day: isoDate }));
      }
    } else {
      setFormData(prev => ({ ...prev, booking_day: '' }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.id_service || !formData.booking_day || !formData.cleaning_time || !formData.address) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      setLoading(false);
      return;
    }

    if (!formData.home_size_sqm || parseFloat(formData.home_size_sqm) <= 0) {
      setError('Vui lòng nhập diện tích nhà (m²)');
      setLoading(false);
      return;
    }

    // Kiểm tra ngày đặt phải từ ngày mai trở đi
    const bookingDate = new Date(formData.booking_day);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (bookingDate < tomorrow) {
      setError('Vui lòng chọn ngày từ ngày mai trở đi');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        home_size_sqm: parseFloat(formData.home_size_sqm),
        special_instructions: formData.special_instructions
      };
      const response = formData.booking_type === 'trial'
        ? await customerAPI.createTrialBooking(payload)
        : await customerAPI.bookService(payload);
      if (response.data.success) {
        setSuccess('Đặt dịch vụ thành công! Chuyển hướng...');
        setTimeout(() => {
          navigate('/customer/bookings');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt dịch vụ thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === parseInt(formData.id_service));
  const sqm = parseFloat(formData.home_size_sqm) || 0;
  const computedFee = selectedService && sqm > 0
    ? Math.round(selectedService.basicPrice * sqm)
    : selectedService
      ? selectedService.basicPrice
      : 0;
  const computedDuration = sqm > 0 ? Math.round(sqm * 3) : (selectedService?.duration || null);

  return (
    <div className="book-service">
      <div className="page-header">
        <h1>Đặt Dịch Vụ Dọn Dẹp</h1>
        <p className="text-muted">Điền thông tin để đặt lịch dọn dẹp</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="row">
        <div className="col-lg-8">
          <div className="booking-form-card">
            <form onSubmit={handleSubmit}>
              {/* Chọn dịch vụ */}
              <div className="mb-4">
                <label htmlFor="id_service" className="form-label">
                  Chọn dịch vụ <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="id_service"
                  name="id_service"
                  value={formData.id_service}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn dịch vụ --</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.serviceName} — {service.basicPrice?.toLocaleString()} VNĐ/m²
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label">Loại đặt lịch</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="booking_type"
                      id="one_time"
                      value="one_time"
                      checked={formData.booking_type === 'one_time'}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="one_time">
                      Đặt lẻ
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="booking_type"
                      id="trial"
                      value="trial"
                      checked={formData.booking_type === 'trial'}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="trial">
                      Buổi dùng thử
                    </label>
                  </div>
                </div>
              </div>

              {/* Diện tích nhà */}
              <div className="mb-4">
                <label htmlFor="home_size_sqm" className="form-label">
                  Diện tích nhà (m²) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    id="home_size_sqm"
                    name="home_size_sqm"
                    value={formData.home_size_sqm}
                    onChange={handleChange}
                    placeholder="Ví dụ: 50"
                    min="1"
                    max="10000"
                    step="0.5"
                    required
                  />
                  <span className="input-group-text">m²</span>
                </div>
                {selectedService && sqm > 0 && (
                  <small className="text-muted">
                    {sqm} m² × {selectedService.basicPrice?.toLocaleString()} VNĐ/m²
                    = <strong>{computedFee.toLocaleString()} VNĐ</strong>
                    &nbsp;·&nbsp;Thời gian ước tính: <strong>{computedDuration} phút</strong>
                  </small>
                )}
              </div>

              {/* Ngày và giờ */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <label htmlFor="booking_day" className="form-label">
                    Ngày đặt lịch <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="booking_day"
                    name="booking_day"
                    value={dateDisplay}
                    onChange={handleDateChange}
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                    required
                  />
                  <small className="text-muted">
                    Ví dụ: 25/12/2025 - Từ ngày mai trở đi
                  </small>
                </div>
                <div className="col-md-6">
                  <label htmlFor="cleaning_time" className="form-label">
                    Giờ dọn dẹp <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    id="cleaning_time"
                    name="cleaning_time"
                    value={formData.cleaning_time}
                    onChange={handleChange}
                    min="07:00"
                    max="20:00"
                    step="1800"
                    required
                  />
                  <small className="text-muted">
                    Format: hh:mm - Từ 07:00 đến 20:00
                  </small>
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="mb-4">
                <label htmlFor="address" className="form-label">
                  Địa chỉ dọn dẹp <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Nguyễn Trãi, Quận 5, TP.HCM"
                  required
                />
              </div>

              {/* Ghi chú */}
              <div className="mb-4">
                <label htmlFor="note" className="form-label">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  className="form-control"
                  id="note"
                  name="note"
                  rows="3"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Ví dụ: Cần dọn kỹ phòng khách, có thú cưng..."
                ></textarea>
              </div>

              <div className="mb-4">
                <label htmlFor="special_instructions" className="form-label">
                  Ghi chú đặc biệt cho nhân viên
                </label>
                <textarea
                  className="form-control"
                  id="special_instructions"
                  name="special_instructions"
                  rows="2"
                  value={formData.special_instructions}
                  onChange={handleChange}
                  placeholder="Ví dụ: Chìa khóa dưới thảm, không vào phòng ngủ..."
                ></textarea>
              </div>

              {/* Phương thức thanh toán */}
              <div className="mb-4">
                <label className="form-label">
                  Phương thức thanh toán <span className="text-danger">*</span>
                </label>
                <div className="payment-options">
                  <div className="form-check payment-option">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="payment_method"
                      id="cash"
                      value="cash"
                      checked={formData.payment_method === 'cash'}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="cash">
                      <div>
                        <strong>Tiền mặt</strong>
                        <p>Thanh toán khi hoàn thành</p>
                      </div>
                    </label>
                  </div>
                  <div className="form-check payment-option">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="payment_method"
                      id="online"
                      value="online"
                      checked={formData.payment_method === 'online'}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="online">
                      <div>
                        <strong>Chuyển khoản</strong>
                        <p>Thanh toán trực tuyến</p>
                        <small className="text-warning">(Hiện chưa có tính năng này, sẽ được hỗ trợ sau)</small>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate('/customer/services')}
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận đặt dịch vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="col-lg-4">
          <div className="booking-summary-card sticky-top">
            <h3>Tóm tắt đơn hàng</h3>

            {serviceProfile && (
              <div className="alert alert-light border">
                <strong>Hồ sơ dịch vụ:</strong>
                <div className="small mt-1">
                  {serviceProfile.homeSizeSqm ? <div>Nhà: {serviceProfile.homeSizeSqm}m²</div> : null}
                  {serviceProfile.priorityAreas ? <div>Ưu tiên: {serviceProfile.priorityAreas}</div> : null}
                  {serviceProfile.hasPets ? <div>Có thú cưng</div> : null}
                </div>
              </div>
            )}

            {selectedService ? (
              <>
                <div className="summary-item">
                  <span className="summary-label">Dịch vụ:</span>
                  <span className="summary-value">{selectedService.serviceName}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Đơn giá:</span>
                  <span className="summary-value">{selectedService.basicPrice?.toLocaleString()} VNĐ/m²</span>
                </div>
                {sqm > 0 && (
                  <div className="summary-item">
                    <span className="summary-label">Diện tích:</span>
                    <span className="summary-value">{sqm} m²</span>
                  </div>
                )}
                <div className="summary-item">
                  <span className="summary-label">Thời gian:</span>
                  <span className="summary-value">
                    {computedDuration ? `${computedDuration} phút` : '—'}
                  </span>
                </div>
                {formData.booking_day && (
                  <div className="summary-item">
                    <span className="summary-label">Ngày:</span>
                    <span className="summary-value">
                      {new Date(formData.booking_day).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
                {formData.cleaning_time && (
                  <div className="summary-item">
                    <span className="summary-label">Giờ:</span>
                    <span className="summary-value">{formData.cleaning_time}</span>
                  </div>
                )}
                <hr />
                <div className="summary-total">
                  <span>Tổng cộng:</span>
                  <span className="price">
                    {sqm > 0 ? computedFee.toLocaleString() : selectedService.basicPrice?.toLocaleString()} VNĐ
                  </span>
                </div>
                {sqm <= 0 && (
                  <small className="text-muted d-block mt-1">
                    * Nhập diện tích để tính chính xác
                  </small>
                )}
              </>
            ) : (
              <p className="text-muted">Vui lòng chọn dịch vụ</p>
            )}

            <div className="booking-notes">
              <h4>Lưu ý:</h4>
              <ul>
                <li>Vui lòng đặt trước ít nhất 1 ngày</li>
                <li>Có thể hủy miễn phí trước 24h</li>
                <li>Nhân viên sẽ liên hệ xác nhận</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookService;
