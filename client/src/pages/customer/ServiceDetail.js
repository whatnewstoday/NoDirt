import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import './Customer.css';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadServiceDetail = useCallback(async () => {
    try {
      const response = await customerAPI.viewServiceDetail(id);
      if (response.data.success) {
        setService(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết dịch vụ:', error);
      setError('Không thể tải thông tin dịch vụ');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    try {
      const [reviewsRes, ratingRes] = await Promise.all([
        customerAPI.getReviewsByService(id),
        customerAPI.getServiceRating(id)
      ]);

      if (reviewsRes.data.success) {
        setReviews(reviewsRes.data.data);
      }

      if (ratingRes.data.success) {
        setRating(ratingRes.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải đánh giá:', error);
    }
  }, [id]);

  useEffect(() => {
    loadServiceDetail();
    loadReviews();
  }, [loadServiceDetail, loadReviews]);


  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-3">Đang tải chi tiết dịch vụ...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Lỗi</h4>
          <p>{error || 'Không tìm thấy dịch vụ'}</p>
          <Link to="/customer/services" className="btn btn-primary">
            Quay lại danh sách dịch vụ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="service-detail">
      <div className="breadcrumb-nav mb-4">
        <Link to="/customer/services" className="breadcrumb-link">
          ← Quay lại danh sách dịch vụ
        </Link>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="detail-card">
            <div className="detail-header">
              <div className="service-icon-xlarge">🧹</div>
              <div>
                <h1 className="service-detail-title">{service.serviceName}</h1>
                <p className="text-muted">Dịch vụ dọn dẹp chuyên nghiệp</p>
              </div>
            </div>

            <div className="detail-body">
              <h3>Mô tả dịch vụ</h3>
              <p className="service-detail-description">
                {service.description || 'Dịch vụ dọn dẹp chuyên nghiệp với đội ngũ nhân viên được đào tạo bài bản. Chúng tôi cam kết mang đến không gian sạch sẽ, ngăn nắp cho ngôi nhà của bạn.'}
              </p>

              <h3 className="mt-4">Quy trình thực hiện</h3>
              <ol className="process-list">
                <li>Khảo sát và đánh giá tình trạng khu vực cần dọn dẹp</li>
                <li>Chuẩn bị dụng cụ và hóa chất vệ sinh chuyên dụng</li>
                <li>Thực hiện dọn dẹp theo tiêu chuẩn chuyên nghiệp</li>
                <li>Kiểm tra và hoàn thiện công việc</li>
                <li>Bàn giao và nhận phản hồi từ khách hàng</li>
              </ol>

              <h3 className="mt-4">Lưu ý</h3>
              <ul className="note-list">
                <li>Vui lòng chuẩn bị sẵn nguồn điện và nước</li>
                <li>Báo trước nếu có vật dụng dễ vỡ hoặc quý giá</li>
                <li>Thời gian có thể thay đổi tùy theo tình trạng thực tế</li>
                <li>Có thể yêu cầu dịch vụ bổ sung khi cần thiết</li>
              </ul>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="detail-card mt-4">
            <h3>Đánh giá dịch vụ</h3>
            
            {rating && rating.totalReviews > 0 ? (
              <>
                <div className="rating-summary mb-4">
                  <div className="rating-score">
                    <h2 className="mb-0">{rating.averageRating.toFixed(1)}/5</h2>
                    <div className="text-muted">{rating.totalReviews} đánh giá</div>
                  </div>
                  <div className="rating-breakdown">
                    <div className="rating-bar">
                      <span>Xuất sắc (4-5)</span>
                      <div className="progress">
                        <div 
                          className="progress-bar bg-success" 
                          style={{ width: `${(rating.excellentCount / rating.totalReviews) * 100}%` }}
                        ></div>
                      </div>
                      <span>{rating.excellentCount}</span>
                    </div>
                    <div className="rating-bar">
                      <span>Trung bình (3)</span>
                      <div className="progress">
                        <div 
                          className="progress-bar bg-info" 
                          style={{ width: `${(rating.goodCount / rating.totalReviews) * 100}%` }}
                        ></div>
                      </div>
                      <span>{rating.goodCount}</span>
                    </div>
                    <div className="rating-bar">
                      <span>Cần cải thiện (1-2)</span>
                      <div className="progress">
                        <div 
                          className="progress-bar bg-warning" 
                          style={{ width: `${(rating.poorCount / rating.totalReviews) * 100}%` }}
                        ></div>
                      </div>
                      <span>{rating.poorCount}</span>
                    </div>
                  </div>
                </div>

                <hr />

                <div className="reviews-list">
                  {reviews.length > 0 ? (
                    reviews.slice(0, 5).map((review) => {
                      const topicsList = review.topics
                        ? (typeof review.topics === 'string' ? JSON.parse(review.topics) : review.topics)
                        : [];

                      return (
                        <div key={review.id} className="review-item">
                          <div className="review-header">
                            <div>
                              <strong>{review.customerName || 'Khách hàng'}</strong>
                              <div className="review-rating">
                                {'⭐'.repeat(Math.round(review.rating))} 
                                <span className="ms-2">{review.rating}/5</span>
                                {review.sentiment && (
                                  <span className={`badge ms-2 bg-${
                                    review.sentiment === 'positive' ? 'success' : 
                                    review.sentiment === 'negative' ? 'danger' : 'secondary'
                                  }`}>
                                    {review.sentiment === 'positive' ? 'Tích cực' : 
                                     review.sentiment === 'negative' ? 'Tiêu cực' : 'Trung lập'}
                                  </span>
                                )}
                                {review.isMismatch === 1 && (
                                  <span className="badge ms-1 bg-warning text-dark">Bất thường</span>
                                )}
                              </div>
                            </div>
                            <small className="text-muted">
                              {new Date(review.reviewDate).toLocaleDateString('vi-VN')}
                            </small>
                          </div>
                          {review.comment && (
                            <p className="review-comment">{review.comment}</p>
                          )}
                          {topicsList.length > 0 && (
                            <div className="review-topics mt-1">
                              {topicsList.map((topic, idx) => (
                                <span key={idx} className="badge bg-light text-dark me-1">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted">Chưa có đánh giá nào</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted">Dịch vụ này chưa có đánh giá nào</p>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="booking-summary-card sticky-top">
            <h3>Thông tin dịch vụ</h3>
            
            <div className="summary-item">
              <div className="summary-label">
                <span className="icon">💰</span>
                Giá dịch vụ
              </div>
              <div className="summary-value price">
                {service.basicPrice?.toLocaleString()} VNĐ/m²
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-label">
                <span className="icon">⏱️</span>
                Thời gian thực hiện
              </div>
              <div className="summary-value">
                {service.duration} phút
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-label">
                <span className="icon">📅</span>
                Đặt lịch
              </div>
              <div className="summary-value">
                Linh hoạt theo yêu cầu
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-label">
                <span className="icon">💳</span>
                Thanh toán
              </div>
              <div className="summary-value">
                Tiền mặt / Online
              </div>
            </div>

            <hr />

            <button 
              className="btn btn-primary btn-lg w-100"
              onClick={() => navigate(`/customer/book-service?serviceId=${service.id}`)}
            >
              Đặt dịch vụ ngay
            </button>

            <p className="text-center text-muted mt-3" style={{ fontSize: '0.9rem' }}>
              ✓ Đội ngũ chuyên nghiệp<br />
              ✓ Dụng cụ hiện đại<br />
              ✓ Giá cả hợp lý
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;

