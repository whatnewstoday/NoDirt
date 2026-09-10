import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { managerAPI } from '../../services/api';
import './Manager.css';

const AssignBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [booking, setBooking] = useState(null);
  const [suggestedEmployees, setSuggestedEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = suggestedEmployees.filter(emp => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (emp.name || '').toLowerCase().includes(term) ||
      (emp.phoneNumber || '').toLowerCase().includes(term) ||
      (emp.email || '').toLowerCase().includes(term) ||
      (emp.responsibleArea || '').toLowerCase().includes(term)
    );
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingRes, suggestRes] = await Promise.all([
        managerAPI.getBookingDetail(id),
        managerAPI.suggestEmployees(id),
      ]);

      if (bookingRes.data.success) {
        setBooking(bookingRes.data.data);
      }
      if (suggestRes.data.success) {
        setSuggestedEmployees(suggestRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssign = async () => {
    if (!selectedEmployee) {
      setError('Vui lòng chọn nhân viên');
      return;
    }

    try {
      setAssigning(true);
      setError('');
      const response = await managerAPI.assignEmployee(id, {
        employeeId: parseInt(selectedEmployee),
      });

      if (response.data.success) {
        setSuccess('Phân công nhân viên thành công!');
        setTimeout(() => {
          navigate('/manager/bookings/pending');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi phân công nhân viên');
    } finally {
      setAssigning(false);
    }
  };

  const handleSemiAutoAssign = async () => {
    try {
      setAutoAssigning(true);
      setError('');
      const response = await managerAPI.semiAutoAssign(id);
      if (response.data.success) {
        const info = response.data.data || {};
        setSuccess(`Phân công bán tự động thành công: ${info.employeeName || ''}`);
        setTimeout(() => {
          navigate('/manager/bookings/pending');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi phân công bán tự động');
    } finally {
      setAutoAssigning(false);
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

  if (!booking) {
    return (
      <div className="manager-page">
        <div className="container">
          <div className="alert alert-danger">Không tìm thấy booking</div>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-page">
      <div className="container">
        <div className="page-header">
          <h1> Phân công nhân viên</h1>
          <p>Booking #{booking.id}</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="row">
          {/* Booking Details */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h3> Thông tin booking</h3>
              </div>
              <div className="card-body">
                <div className="detail-row">
                  <strong>Khách hàng:</strong>
                  <span>{booking.customerName}</span>
                </div>
                <div className="detail-row">
                  <strong>Số điện thoại:</strong>
                  <span>{booking.customerPhone}</span>
                </div>
                <div className="detail-row">
                  <strong>Email:</strong>
                  <span>{booking.customerEmail}</span>
                </div>
                <div className="detail-row">
                  <strong>Dịch vụ:</strong>
                  <span>{booking.serviceName}</span>
                </div>
                <div className="detail-row">
                  <strong>Ngày làm việc:</strong>
                  <span>{formatDate(booking.bookingDate)}</span>
                </div>
                <div className="detail-row">
                  <strong>Giờ bắt đầu:</strong>
                  <span>{formatTime(booking.cleaningTime)}</span>
                </div>
                <div className="detail-row">
                  <strong>Thời gian:</strong>
                  <span>{booking.serviceDuration} phút</span>
                </div>
                <div className="detail-row">
                  <strong>Địa chỉ:</strong>
                  <span>{booking.address}</span>
                </div>
                <div className="detail-row">
                  <strong>Tổng phí:</strong>
                  <span className="text-success">
                    <strong>{formatCurrency(booking.totalPrice)}</strong>
                  </span>
                </div>
                {booking.note && (
                  <div className="detail-row">
                    <strong>Ghi chú:</strong>
                    <span>{booking.note}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suggested Employees */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h3> Gợi ý nhân viên</h3>
              </div>
              <div className="card-body">
                {suggestedEmployees.length === 0 ? (
                  <div className="alert alert-warning">
                    Không có nhân viên rảnh phù hợp
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="🔍 Tìm nhân viên theo tên, SĐT, email, khu vực..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                          width: '100%',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <p className="text-muted mb-3">
                      Hiển thị {filteredEmployees.length}/{suggestedEmployees.length} nhân viên rảnh — sắp xếp theo khu vực và lịch
                    </p>
                    <div className="employees-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {filteredEmployees.length === 0 ? (
                        <div className="alert alert-info">
                          Không tìm thấy nhân viên phù hợp với "{searchTerm}"
                        </div>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <div
                            key={employee.id}
                            className={`employee-card ${selectedEmployee === employee.id.toString()
                              ? 'selected'
                              : ''
                              }`}
                            onClick={() => setSelectedEmployee(employee.id.toString())}
                          >
                            <div className="employee-info">
                              <div className="employee-name">
                                <strong>{employee.name}</strong>
                                {employee.isAreaMatch && (
                                  <span className="badge badge-success" style={{ marginLeft: '8px', fontSize: '11px' }}>
                                    📍 Đúng khu vực
                                  </span>
                                )}
                                {employee.isPreferredMatch && (
                                  <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '11px' }}>
                                    ⭐ NV quen
                                  </span>
                                )}
                              </div>
                              <div className="employee-details">
                                <span>📞 {employee.phoneNumber}</span>
                                <span>✉️ {employee.email}</span>
                                <span>📍 {employee.responsibleArea}</span>
                                <span className="badge badge-info" style={{ fontSize: '11px' }}>
                                  {employee.activeJobs} việc đang làm
                                </span>
                              </div>
                            </div>
                            <div className="employee-select">
                              <input
                                type="radio"
                                name="employee"
                                value={employee.id}
                                checked={selectedEmployee === employee.id.toString()}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={() => navigate('/manager/bookings/pending')}
            className="btn btn-secondary"
          >
            ← Quay lại
          </button>
          <button
            onClick={handleSemiAutoAssign}
            className="btn btn-outline-primary"
            disabled={assigning || autoAssigning}
          >
            {autoAssigning ? 'Đang tự chọn...' : 'Phân công bán tự động'}
          </button>
          <button
            onClick={handleAssign}
            className="btn btn-primary"
            disabled={!selectedEmployee || assigning}
          >
            {assigning ? 'Đang phân công...' : 'Phân công nhân viên'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignBooking;

