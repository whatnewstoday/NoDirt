import React, { useState, useEffect } from 'react';
import { managerAPI } from '../../services/api';
import './Manager.css';

const Employees = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [editArea, setEditArea] = useState('');
  const [saving, setSaving] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.getAllEmployees();
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async (employeeId) => {
    try {
      setLoadingSchedule(true);
      const response = await managerAPI.getEmployeeSchedule(
        employeeId,
        dateRange.startDate,
        dateRange.endDate
      );
      if (response.data.success) {
        setSchedule(response.data.data);
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
      setSchedule([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleViewSchedule = (employee) => {
    setSelectedEmployee(employee);
    setEditArea(employee.responsibleArea || '');
    setError('');
    setSuccess('');
    loadSchedule(employee.id);
  };

  const handleSaveArea = async () => {
    if (!selectedEmployee) return;

    try {
      setSaving(true);
      setError('');
      const response = await managerAPI.updateEmployeeArea(selectedEmployee.id, {
        responsibleArea: editArea
      });

      if (response.data.success) {
        setSuccess('Cập nhật khu vực thành công!');
        // Update local state
        setEmployees(employees.map(emp =>
          emp.id === selectedEmployee.id
            ? { ...emp, responsibleArea: editArea }
            : emp
        ));
        setSelectedEmployee({ ...selectedEmployee, responsibleArea: editArea });
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật khu vực');
    } finally {
      setSaving(false);
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
          <h1>Danh sách nhân viên</h1>
          <p>Quản lý và xem lịch làm việc của nhân viên</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
            <button onClick={loadEmployees} className="btn btn-sm btn-outline-danger ms-3">
              Thử lại
            </button>
          </div>
        )}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="row">
          {/* Employees List */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h3>Danh sách nhân viên</h3>
              </div>
              <div className="card-body">
                {employees.length === 0 ? (
                  <p className="text-muted">Chưa có nhân viên nào</p>
                ) : (
                  <div className="employees-list">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className={`employee-card ${selectedEmployee?.id === employee.id ? 'selected' : ''
                          }`}
                        onClick={() => handleViewSchedule(employee)}
                      >
                        <div className="employee-info">
                          <div className="employee-name">
                            <strong>{employee.name}</strong>
                            <span className="badge badge-info ms-2">
                              {employee.activeJobs} công việc
                            </span>
                          </div>
                          <div className="employee-details">
                            <span>{employee.phoneNumber}</span>
                            <span>{employee.email}</span>
                            <span>{employee.responsibleArea || 'Chưa phân công'}</span>
                          </div>
                        </div>
                        <button className="btn btn-sm btn-outline-primary">
                          Chọn →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employee Details & Schedule */}
          <div className="col-md-6">
            {/* Employee Info & Edit Area */}
            {selectedEmployee && (
              <div className="card mb-3">
                <div className="card-header">
                  <h3>Thông tin nhân viên</h3>
                </div>
                <div className="card-body">
                  <div className="employee-detail-info mb-3">
                    <h4>{selectedEmployee.name}</h4>
                    <p className="text-muted mb-1">{selectedEmployee.email}</p>
                    <p className="text-muted mb-0">{selectedEmployee.phoneNumber || 'Chưa có'}</p>
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="responsibleArea" className="form-label">
                      <strong>Khu vực phụ trách</strong>
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        id="responsibleArea"
                        className="form-control"
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                        placeholder="Ví dụ: Quận 1, Quận 3, Bình Thạnh"
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleSaveArea}
                        disabled={saving}
                      >
                        {saving ? 'Đang lưu...' : 'Lưu'}
                      </button>
                    </div>
                    <small className="text-muted">
                      Nhập các khu vực nhân viên này phụ trách, cách nhau bằng dấu phẩy
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Card */}
            <div className="card">
              <div className="card-header">
                <h3>Lịch làm việc</h3>
              </div>
              <div className="card-body">
                {!selectedEmployee ? (
                  <p className="text-muted">Chọn nhân viên để xem thông tin và lịch làm việc</p>
                ) : loadingSchedule ? (
                  <div className="loading-spinner">Đang tải lịch...</div>
                ) : (
                  <>
                    <div className="schedule-header">
                      <p className="text-muted">
                        {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                      </p>
                    </div>
                    {schedule.length === 0 ? (
                      <p className="text-muted">Không có lịch làm việc trong khoảng thời gian này</p>
                    ) : (
                      <div className="schedule-list">
                        {schedule.map((booking) => (
                          <div key={booking.id} className="schedule-item">
                            <div className="schedule-date">
                              <strong>{formatDate(booking.bookingDay)}</strong>
                              <span className="text-muted">{formatTime(booking.cleaningTime)}</span>
                            </div>
                            <div className="schedule-details">
                              <strong>{booking.serviceName}</strong>
                              <span>{booking.customerName}</span>
                              <span className="text-muted">{booking.customerAddress}</span>
                              <span className="badge badge-info">{booking.duration} phút</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;
