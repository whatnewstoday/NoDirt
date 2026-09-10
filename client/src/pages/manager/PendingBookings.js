import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { managerAPI } from '../../services/api';
import './Manager.css';

const PendingBookings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.getPendingBookings();
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách booking');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="manager-page">
        <div className="container">
          <div className="loading-spinner">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-page">
      <div className="container">
        <div className="page-header">
          <h1> Booking chờ phân công</h1>
          <p>Danh sách booking cần phân công nhân viên</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
            <button onClick={loadBookings} className="btn btn-sm btn-outline-danger ms-3">
              Thử lại
            </button>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="empty-state">
            
            <h3>Không có booking chờ phân công</h3>
            <p>Tất cả booking đã được phân công nhân viên</p>
            <Link to="/manager/dashboard" className="btn btn-primary">
              Về Dashboard
            </Link>
          </div>
        ) : (
          <div className="bookings-table-container">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách hàng</th>
                  <th>Dịch vụ</th>
                  <th>Ngày & Giờ</th>
                  <th>Địa chỉ</th>
                  <th>Tổng phí</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>#{booking.id}</td>
                    <td>
                      <div>
                        <strong>{booking.customerName}</strong>
                        <br />
                        <small className="text-muted">{booking.customerPhone}</small>
                      </div>
                    </td>
                    <td>{booking.serviceName}</td>
                    <td>
                      <div>
                        <strong>{formatDate(booking.bookingDate)}</strong>
                        <br />
                        <small className="text-muted">{formatTime(booking.cleaningTime)}</small>
                      </div>
                    </td>
                    <td>
                      <small>{booking.address}</small>
                    </td>
                    <td>
                      <strong className="text-success">
                        {formatCurrency(booking.totalPrice)}
                      </strong>
                    </td>
                    <td>
                      <Link
                        to={`/manager/bookings/${booking.id}/assign`}
                        className="btn btn-sm btn-primary"
                      >
                        Phân công
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingBookings;

