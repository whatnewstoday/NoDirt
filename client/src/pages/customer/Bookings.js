import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import './Customer.css';

const TAB_KEYS = ['all', 'upcoming', 'in-progress', 'completed', 'cancelled'];

const Bookings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');


  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterBookings = useCallback(() => {
    if (activeTab === 'all') {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(booking => {
        if (activeTab === 'upcoming') {
          return booking.status === 'booked' || booking.status === 'confirmed' || booking.status === 'processing';
        } else if (activeTab === 'in-progress') {
          return booking.status === 'in progress';
        } else if (activeTab === 'completed') {
          return booking.status === 'completed';
        } else if (activeTab === 'cancelled') {
          return booking.status === 'cancelled';
        }
        return true;
      });
      setFilteredBookings(filtered);
    }
  }, [activeTab, bookings]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const loadBookings = async () => {
    try {
      const response = await customerAPI.getBookings();
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRebook = async (bookingId) => {
    try {
      await customerAPI.rebookFromHistory(bookingId);
      await loadBookings();
      alert('Đặt lại lịch cũ thành công');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể đặt lại lịch');
    }
  };

  const handleConvertToRecurring = async (bookingId) => {
    try {
      await customerAPI.convertTrialToRecurring({
        trial_booking_id: bookingId,
        frequency: 'weekly',
        cycles: 4
      });
      alert('Đã chuyển sang gói định kỳ theo tuần (4 buổi)');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể chuyển sang gói định kỳ');
    }
  };


  const getStatusBadge = (status) => {
    const badges = {
      'booked': 'badge-primary',
      'confirmed': 'badge-info',
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
      'confirmed': 'Đã xác nhận',
      'processing': 'Đang xử lý',
      'in progress': 'Đang thực hiện',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return texts[status] || status;
  };

  const getPaymentBadge = (status) => {
    return status === 'paid' ? 'badge-success' : 'badge-secondary';
  };

  const getPaymentText = (status) => {
    return status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
  };

  const tabs = [
    { key: 'all', label: 'Tất cả', count: bookings.length },
    { key: 'upcoming', label: 'Sắp tới', count: bookings.filter(b => b.status === 'booked' || b.status === 'confirmed' || b.status === 'processing').length },
    { key: 'in-progress', label: 'Đang làm', count: bookings.filter(b => b.status === 'in progress').length },
    { key: 'completed', label: 'Hoàn thành', count: bookings.filter(b => b.status === 'completed').length },
    { key: 'cancelled', label: 'Đã hủy', count: bookings.filter(b => b.status === 'cancelled').length }
  ];

  // Sync active tab with URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && TAB_KEYS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    if (!tabParam && activeTab !== 'all') {
      setActiveTab('all');
    }
  }, [location.search, activeTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    const params = new URLSearchParams(location.search);
    if (tabKey === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', tabKey);
    }
    navigate({
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : ''
    }, { replace: true });
  };

  return (
    <div className="customer-bookings">
      <div className="page-header">
        <h1>Đơn Hàng Của Tôi</h1>
        <Link to="/customer/book-service" className="btn btn-primary">
          + Đặt dịch vụ mới
        </Link>
      </div>

      {/* Tabs */}
      <div className="booking-tabs mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3">Đang tải đơn hàng...</p>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="bookings-list">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="booking-item">
              <div className="booking-item-header">
                <div>
                  <h3 className="booking-service-name">{booking.serviceName}</h3>
                  <p className="booking-date">
                    
                    {new Date(booking.bookingDay).toLocaleDateString('vi-VN')} - {booking.cleaningTime}
                  </p>
                </div>
                <div className="booking-badges">
                  <span className={`badge ${getStatusBadge(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                  <span className={`badge ${getPaymentBadge(booking.paymentStatus)}`}>
                    {getPaymentText(booking.paymentStatus)}
                  </span>
                </div>
              </div>

              <div className="booking-item-body">
                <div className="booking-info-row">
                  <div className="booking-info-item">
                    
                    <div>
                      <span className="label">Địa chỉ:</span>
                      <span className="value">{booking.address}</span>
                    </div>
                  </div>
                  {booking.note && (
                    <div className="booking-info-item">
                      
                      <div>
                        <span className="label">Ghi chú:</span>
                        <span className="value">{booking.note}</span>
                      </div>
                    </div>
                  )}
                  <div className="booking-info-item">
                    
                    <div>
                      <span className="label">Thanh toán:</span>
                      <span className="value">{booking.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="booking-item-footer">
                <div className="booking-total">
                  <span>Tổng tiền:</span>
                  <span className="price">{booking.totalFee?.toLocaleString()} VNĐ</span>
                </div>
                <div className="booking-actions">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => handleRebook(booking.id)}
                  >
                    Đặt lại nhanh
                  </button>
                  <Link 
                    to={`/customer/bookings/${booking.id}`}
                    className="btn btn-outline-primary btn-sm"
                  >
                    Chi tiết
                  </Link>
                  {booking.bookingType === 'trial' && (
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      onClick={() => handleConvertToRecurring(booking.id)}
                    >
                      Chuyển gói định kỳ
                    </button>
                  )}
                  {booking.status === 'completed' && (
                    <Link
                      to={`/customer/review/${booking.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Đánh giá
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          
          <h4>Không có đơn hàng nào</h4>
          <p>
            {activeTab === 'all' 
              ? 'Bạn chưa có đơn hàng nào. Đặt dịch vụ ngay!' 
              : 'Không có đơn hàng nào trong danh mục này'}
          </p>
          {activeTab === 'all' && (
            <Link to="/customer/services" className="btn btn-primary">
              Xem dịch vụ
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Bookings;

