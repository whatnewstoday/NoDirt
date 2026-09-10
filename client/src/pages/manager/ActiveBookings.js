import React, { useState, useEffect } from 'react';
import { managerAPI } from '../../services/api';
import './Manager.css';

const ActiveBookings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.getActiveBookings();
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách booking');
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const isoCandidate = dateString.replace(' ', 'T');
    const parsed = new Date(isoCandidate);
    if (!isNaN(parsed.getTime())) return parsed;

    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = (datePart || '').split(/[-/]/).map(Number);
    if (!year || !month || !day) return null;
    const [hour = 0, minute = 0, second = 0] = (timePart || '').split(':').map(Number);
    return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseDate(dateString);
    return date ? date.toLocaleDateString('vi-VN') : '';
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const normalizeStatus = (status = '') =>
    status.toString().toLowerCase().trim().replace(/[\s-]+/g, '_');

  const getStatusBadge = (status) => {
    const key = normalizeStatus(status);
    const statusMap = {
      processing: { class: 'badge-primary', text: 'Đang thực hiện' },
      in_progress: { class: 'badge-primary', text: 'Đang thực hiện' },
    };
    const statusInfo = statusMap[key] || { class: 'badge-secondary', text: status };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
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
          <h1> Booking đang thực hiện</h1>
          <p>Danh sách booking đang được thực hiện bởi nhân viên</p>
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
            <div className="empty-icon">📭</div>
            <h3>Không có booking đang thực hiện</h3>
            <p>Hiện tại không có booking nào đang được thực hiện</p>
          </div>
        ) : (
          <div className="bookings-table-container">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách hàng</th>
                  <th>Dịch vụ</th>
                  <th>Nhân viên</th>
                  <th>Ngày & Giờ</th>
                  <th>Trạng thái</th>
                  <th>Tổng phí</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>#{booking.id}</td>
                    <td>
                      <div>
                        <strong>{booking.customerName}</strong>
                      </div>
                    </td>
                    <td>{booking.serviceName}</td>
                    <td>
                      <div>
                        <strong>{booking.employeeName}</strong>
                        <br />
                        <small className="text-muted">{booking.employeePhone}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{formatDate(booking.bookingDate)}</strong>
                        <br />
                        <small className="text-muted">{formatTime(booking.cleaningTime)}</small>
                      </div>
                    </td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td>
                      <strong className="text-success">
                        {formatCurrency(booking.totalPrice)}
                      </strong>
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

export default ActiveBookings;

