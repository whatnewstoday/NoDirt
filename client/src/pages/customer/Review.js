import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import './Customer.css';

const Review = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    id_booking: parseInt(bookingId),
    rating: 0,
    comment: ''
  });

  const loadBooking = useCallback(async () => {
    try {
      const response = await customerAPI.getBookings();
      if (response.data.success) {
        const foundBooking = response.data.data.find(b => b.id === parseInt(bookingId));
        if (foundBooking) {
          if (foundBooking.status !== 'completed') {
            setError('Chỉ có thể đánh giá khi dịch vụ đã hoàn thành');
          }
          setBooking(foundBooking);

          // Kiểm tra xem đã có review chưa
          try {
            const reviewRes = await customerAPI.getReviewByBooking(bookingId);
            if (reviewRes.data.success) {
              setExistingReview(reviewRes.data.data);
              setError('Bạn đã đánh giá đơn hàng này rồi');
            }
          } catch (err) {
            // Chưa có review - OK
          }
        } else {
          setError('Không tìm thấy đơn hàng');
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải đơn hàng:', error);
      setError('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);


  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (formData.rating === 0) {
      setError('Vui lòng chọn số sao đánh giá');
      setSubmitting(false);
      return;
    }

    if (!formData.comment.trim()) {
      setError('Vui lòng nhập nhận xét của bạn');
      setSubmitting(false);
      return;
    }

    try {
      const response = await customerAPI.addReview(formData);
      if (response.data.success) {
        setSuccess('Gửi đánh giá thành công! Cảm ơn bạn đã phản hồi.');
        setTimeout(() => {
          navigate('/customer/bookings');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Lỗi</h4>
          <p>{error}</p>
          <Link to="/customer/bookings" className="btn btn-primary">
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="breadcrumb-nav mb-4">
        <Link to={`/customer/bookings/${bookingId}`} className="breadcrumb-link">
          ← Quay lại chi tiết đơn hàng
        </Link>
      </div>

      <div className="page-header">
        <h1>Đánh Giá Dịch Vụ</h1>
        <p className="text-muted">Chia sẻ trải nghiệm của bạn với chúng tôi</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Service Info Card */}
          {booking && (
            <div className="review-service-card mb-4">
              <div className="service-info">

                <div>
                  <h3>{booking.serviceName}</h3>
                  <p className="text-muted">
                    {new Date(booking.bookingDay).toLocaleDateString('vi-VN')} - {booking.cleaningTime}
                  </p>
                  <p className="text-muted">{booking.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Existing Review */}
          {existingReview && (
            <div className="alert alert-info mb-4">
              <h4>Đánh giá của bạn</h4>
              <div className="review-rating">
                {'⭐'.repeat(existingReview.rating)}
                <span className="ms-2">{existingReview.rating}/10</span>
              </div>
              <p className="mt-2 mb-0">{existingReview.comment}</p>
              <small className="text-muted">
                Đã đánh giá vào {new Date(existingReview.reviewDate).toLocaleDateString('vi-VN')}
              </small>
            </div>
          )}

          {/* Review Form */}
          {!existingReview && booking && booking.status === 'completed' && (
            <div className="review-form-card">
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger mb-3">{error}</div>}
                {/* Rating Stars */}
                <div className="mb-4">
                  <label className="form-label">
                    Đánh giá của bạn <span className="text-danger">*</span>
                  </label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star ${formData.rating >= star ? 'active' : ''}`}
                        onClick={() => handleRatingClick(star)}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <div className="rating-labels">
                    <span>1 - Rất tệ</span>
                    <span className="rating-value">
                      {formData.rating > 0 && `${formData.rating}/10`}
                    </span>
                    <span>10 - Xuất sắc</span>
                  </div>
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <label htmlFor="comment" className="form-label">
                    Nhận xét của bạn <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    id="comment"
                    name="comment"
                    rows="6"
                    value={formData.comment}
                    onChange={handleChange}
                    placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ... (Chất lượng dọn dẹp, thái độ nhân viên, thời gian thực hiện...)"
                    required
                  ></textarea>
                  <small className="text-muted">Tối thiểu 10 ký tự</small>
                </div>

                {/* Review Tips */}
                <div className="review-tips mb-4">
                  <h4> Gợi ý đánh giá:</h4>
                  <ul>
                    <li>Chất lượng công việc dọn dẹp</li>
                    <li>Thái độ phục vụ của nhân viên</li>
                    <li>Đúng giờ và chuyên nghiệp</li>
                    <li>Giá cả có hợp lý không</li>
                    <li>Bạn có giới thiệu cho người khác không</li>
                  </ul>
                </div>

                {/* Buttons */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(`/customer/bookings/${bookingId}`)}
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || formData.rating === 0}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!booking || booking.status !== 'completed' && !existingReview && (
            <div className="alert alert-warning">
              <p className="mb-0">Bạn chỉ có thể đánh giá sau khi dịch vụ hoàn thành.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Review;

