import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import './Customer.css';

const BookingDetail = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookingDetail = useCallback(async () => {
    try {
      const response = await customerAPI.getBookings();
      if (response.data.success) {
        const foundBooking = response.data.data.find(b => b.id === parseInt(id));
        if (foundBooking) {
          setBooking(foundBooking);
        } else {
          setError('Không tìm thấy đơn hàng');
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết đơn hàng:', error);
      setError('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBookingDetail();
  }, [loadBookingDetail]);


  const getStatusBadge = (status) => {
    const badges = {
      'booked': 'badge-primary',
      'processing': 'badge-warning',
      'in progress': 'badge-info',
      'completed': 'badge-success',
      'cancelled': 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      'booked': 'Đã đặt',
      'processing': 'Đang xử lý',
      'in progress': 'Đang thực hiện',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return texts[status] || status;
  };

  const getStatusTimeline = (status) => {
    const statuses = ['booked', 'processing', 'in progress', 'completed'];
    const currentIndex = statuses.indexOf(status);

    return [
      { key: 'booked', label: 'Đã đặt', completed: currentIndex >= 0 },
      { key: 'processing', label: 'Đang xử lý', completed: currentIndex >= 1 },
      { key: 'in progress', label: 'Đang thực hiện', completed: currentIndex >= 2 },
      { key: 'completed', label: 'Hoàn thành', completed: currentIndex >= 3 }
    ];
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-3">Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Lỗi</h4>
          <p>{error || 'Không tìm thấy đơn hàng'}</p>
          <Link to="/customer/bookings" className="btn btn-primary">
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  const timeline = getStatusTimeline(booking.status);

  return (
    <div className="booking-detail">
      <div className="breadcrumb-nav mb-4">
        <Link to="/customer/bookings" className="breadcrumb-link">
          Quay lại danh sách đơn hàng
        </Link>
      </div>

      <div className="detail-header mb-4">
        <div>
          <h1>Chi Tiết Đơn Hàng #{booking.id}</h1>
          <p className="text-muted">Ngày đặt: {new Date(booking.createdAt || booking.bookingDay).toLocaleDateString('vi-VN')}</p>
        </div>
        <span className={`badge ${getStatusBadge(booking.status)} badge-lg`}>
          {getStatusText(booking.status)}
        </span>
      </div>

      {/* Timeline */}
      {booking.status !== 'cancelled' && (
        <div className="status-timeline mb-5">
          {timeline.map((step, index) => (
            <div key={step.key} className={`timeline-step ${step.completed ? 'completed' : ''}`}>
              <div className="timeline-dot">
                {step.completed ? '' : index + 1}
              </div>
              <div className="timeline-label">{step.label}</div>
              {index < timeline.length - 1 && <div className="timeline-line"></div>}
            </div>
          ))}
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          {/* Service Info */}
          <div className="detail-card mb-4">
            <h3 className="card-title">Thông tin dịch vụ</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Dịch vụ:</span>
                <span className="info-value">{booking.serviceName}</span>
              </div>
              {booking.serviceDescription && (
                <div className="info-item">
                  <span className="info-label">Mô tả:</span>
                  <span className="info-value">{booking.serviceDescription}</span>
                </div>
              )}
            </div>
          </div>

          {/* Booking Info */}
          <div className="detail-card mb-4">
            <h3 className="card-title">Thông tin đặt lịch</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Ngày:</span>
                <span className="info-value">{new Date(booking.bookingDay).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Giờ:</span>
                <span className="info-value">{booking.cleaningTime}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">Địa chỉ:</span>
                <span className="info-value">{booking.address}</span>
              </div>
              {booking.note && (
                <div className="info-item full-width">
                  <span className="info-label">Ghi chú:</span>
                  <span className="info-value">{booking.note}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="detail-card mb-4">
            <h3 className="card-title">Thông tin khách hàng</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Tên:</span>
                <span className="info-value">{booking.customerName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">SĐT:</span>
                <span className="info-value">{booking.customerPhone}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">Email:</span>
                <span className="info-value">{booking.customerEmail}</span>
              </div>
            </div>
          </div>

          {/* Employee Info (if assigned) */}
          {booking.employeeName && (
            <div className="detail-card mb-4">
              <h3 className="card-title">Thông tin nhân viên</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Tên:</span>
                  <span className="info-value">{booking.employeeName}</span>
                </div>
                {booking.employeePhone && (
                  <div className="info-item">
                    <span className="info-label">SĐT:</span>
                    <span className="info-value">{booking.employeePhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="col-lg-4">
          <div className="summary-card sticky-top">
            <h3 className="card-title">Tóm tắt thanh toán</h3>

            <div className="summary-row">
              <span>Dịch vụ:</span>
              <span>{booking.totalFee?.toLocaleString()} VNĐ</span>
            </div>

            <hr />

            <div className="summary-row total">
              <span>Tổng cộng:</span>
              <span className="price">{booking.totalFee?.toLocaleString()} VNĐ</span>
            </div>

            <div className="payment-info mt-3">
              <div className="info-item">
                <span className="info-label">Phương thức:</span>
                <span className="info-value">
                  {booking.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Trạng thái:</span>
                <span className={`badge ${booking.paymentStatus === 'paid' ? 'badge-success' : 'badge-secondary'}`}>
                  {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>

            {booking.status === 'completed' && (
              <Link
                to={`/customer/review/${booking.id}`}
                className="btn btn-primary w-100 mt-3"
              >
                Đánh giá dịch vụ
              </Link>
            )}

            {(booking.status === 'booked' || booking.status === 'processing') && (
              <div className="alert alert-info mt-3">
                <small>
                  <strong>Lưu ý:</strong> Bạn có thể hủy đơn hàng trước 24h.
                  Vui lòng liên hệ hotline để hủy.
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;

