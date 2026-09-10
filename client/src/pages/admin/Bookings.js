import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import './Admin.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bookings]);

  const loadData = async () => {
    try {
      const bookingsRes = await adminAPI.getAllBookings();

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    if (activeTab === 'all') {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(booking => booking.status === activeTab);
      setFilteredBookings(filtered);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    if (!window.confirm(`Xác nhận cập nhật trạng thái đơn hàng?`)) {
      return;
    }

    try {
      await adminAPI.updateBookingStatus(bookingId, { status: newStatus });
      setSuccess('Cập nhật trạng thái thành công!');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Không thể cập nhật trạng thái. Vui lòng thử lại.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'badge-warning',
      'confirmed': 'badge-info',
      'in_progress': 'badge-primary',
      'completed': 'badge-success',
      'cancelled': 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'in_progress': 'Đang thực hiện',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return texts[status] || status;
  };

  const getPaymentBadge = (status) => {
    return status === 'paid' ? 'badge-success' : 'badge-warning';
  };

  const getPaymentText = (status) => {
    return status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
  };

  const tabs = [
    { key: 'all', label: 'Tất cả', count: bookings.length },
    { key: 'pending', label: 'Chờ xác nhận', count: bookings.filter(b => b.status === 'pending').length },
    { key: 'confirmed', label: 'Đã xác nhận', count: bookings.filter(b => b.status === 'confirmed').length },
    { key: 'in_progress', label: 'Đang thực hiện', count: bookings.filter(b => b.status === 'in_progress').length },
    { key: 'completed', label: 'Hoàn thành', count: bookings.filter(b => b.status === 'completed').length },
    { key: 'cancelled', label: 'Đã hủy', count: bookings.filter(b => b.status === 'cancelled').length }
  ];

  return (
    <div className="admin-bookings">
      <div className="page-header">
        <h1>Quản Lý Đơn Hàng</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div className="request-tabs mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
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
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>Ngày hẹn</th>
                <th>Địa chỉ</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Nhân viên</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td><strong>#{booking.id}</strong></td>
                  <td>{booking.customerName}</td>
                  <td>{booking.serviceName}</td>
                  <td>{new Date(booking.bookingDate).toLocaleDateString('vi-VN')}</td>
                  <td className="text-truncate" style={{ maxWidth: '200px' }}>
                    {booking.address}
                  </td>
                  <td><strong>{booking.totalPrice?.toLocaleString()} VNĐ</strong></td>
                  <td>
                    <span className={`badge ${getPaymentBadge(booking.paymentStatus)}`}>
                      {getPaymentText(booking.paymentStatus)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </td>
                  <td>
                    {booking.employeeName ? (
                      <span>👷 {booking.employeeName}</span>
                    ) : (
                      <span className="text-muted">Chưa phân công</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-group-vertical btn-group-sm">
                      {booking.status === 'pending' && (
                        <button
                          className="btn btn-sm btn-outline-success mb-1"
                          onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                        >
                          Xác nhận
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          className="btn btn-sm btn-outline-info mb-1"
                          onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                        >
                          Bắt đầu
                        </button>
                      )}
                      {booking.status === 'in_progress' && (
                        <button
                          className="btn btn-sm btn-outline-success mb-1"
                          onClick={() => handleUpdateStatus(booking.id, 'completed')}
                        >
                          Hoàn thành
                        </button>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                        >
                          Hủy
                        </button>
                      )}
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        (Phân công: Manager)
                      </small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h4>Không có đơn hàng nào</h4>
          <p>
            {activeTab === 'all' 
              ? 'Chưa có đơn hàng nào trong hệ thống' 
              : 'Không có đơn hàng nào trong danh mục này'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Bookings;

