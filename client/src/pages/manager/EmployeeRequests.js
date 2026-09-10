import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  UserPlus,
  Edit3,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { managerAPI } from '../../services/api';
import './Manager.css';

const EmployeeRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState({
    employeeName: '',
    employeeEmail: '',
    employeePhone: '',
    responsibleArea: '',
    requestNote: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.getMyEmployeeRequests();
      console.log('Manager - Response:', response);
      console.log('Manager - Data:', response.data);
      if (response.data.success) {
        console.log('Manager - Requests:', response.data.data);
        setRequests(response.data.data);
      }
    } catch (err) {
      console.error('Manager - Error:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOpenModal = (request = null) => {
    if (request) {
      setEditingRequest(request);
      setFormData({
        employeeName: request.employeeName,
        employeeEmail: request.employeeEmail,
        employeePhone: request.employeePhone || '',
        responsibleArea: request.responsibleArea || '',
        requestNote: request.requestNote || ''
      });
    } else {
      setEditingRequest(null);
      setFormData({
        employeeName: '',
        employeeEmail: '',
        employeePhone: '',
        responsibleArea: '',
        requestNote: ''
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRequest(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.employeeName.trim() || !formData.employeeEmail.trim()) {
      setError('Vui lòng điền tên và email nhân viên');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.employeeEmail)) {
      setError('Email không hợp lệ');
      return;
    }

    try {
      if (editingRequest) {
        await managerAPI.updateEmployeeRequest(editingRequest.id, formData);
        setSuccess('Cập nhật yêu cầu thành công!');
      } else {
        await managerAPI.createEmployeeRequest(formData);
        setSuccess('Tạo yêu cầu thành công! Vui lòng chờ admin phê duyệt.');
      }
      handleCloseModal();
      loadRequests();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu này?')) {
      return;
    }

    try {
      await managerAPI.cancelEmployeeRequest(requestId);
      setSuccess('Đã hủy yêu cầu thành công');
      loadRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi hủy yêu cầu');
    }
  };

  const handleMarkAsProcessed = (id) => {
    alert('Yêu cầu đã được đánh dấu là đã xử lý');
  };

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter(req => req.status === filter);
  }, [requests, filter]);

  console.log('Manager - All requests:', requests);
  console.log('Manager - Filtered requests:', filteredRequests);
  console.log('Manager - Current filter:', filter);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }), [requests]);

  const statCards = [
    {
      title: 'Tổng yêu cầu',
      value: stats.total,
      icon: Users,
      accent: 'stat-blue'
    },
    {
      title: 'Chờ duyệt',
      value: stats.pending,
      icon: Clock,
      accent: 'stat-orange'
    },
    {
      title: 'Đã duyệt',
      value: stats.approved,
      icon: CheckCircle,
      accent: 'stat-green'
    },
    {
      title: 'Từ chối',
      value: stats.rejected,
      icon: XCircle,
      accent: 'stat-red'
    }
  ];

  const filterOptions = [
    { value: 'all', label: `Tất cả (${stats.total})` },
    { value: 'pending', label: `Chờ duyệt (${stats.pending})` },
    { value: 'approved', label: `Đã duyệt (${stats.approved})` },
    { value: 'rejected', label: `Từ chối (${stats.rejected})` }
  ];

  const getStatusLabel = (status) => {
    if (status === 'approved') return 'đã duyệt';
    if (status === 'rejected') return 'từ chối';
    return 'chờ duyệt';
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') return 'order-status-completed';
    if (status === 'rejected') return 'order-status-cancelled';
    return 'order-status-upcoming';
  };

  const filterLabel = useMemo(() => {
    if (filter === 'all') return 'Tất cả yêu cầu';
    return `Trạng thái: ${getStatusLabel(filter)}`;
  }, [filter]);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="manager-requests-page">
      <section className="welcome-section manager requests">
        <div className="welcome-overlay"></div>
        <div className="welcome-content">
          <div className="welcome-text">
            <p className="welcome-subtitle">Quản lý nhân sự</p>
            <h1 className="welcome-title">Yêu cầu bổ sung nhân viên</h1>
            <p className="welcome-description">
              Theo dõi trạng thái phê duyệt và gửi thêm đề xuất nhân viên cho admin chỉ trong vài bước.
            </p>
            <button className="btn btn-primary hero-btn" onClick={() => handleOpenModal()}>
              <UserPlus size={18} />
              <span>Tạo yêu cầu mới</span>
            </button>
          </div>
          <div className="welcome-illustration">
            <img
              src="https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=600&q=80"
              alt="Staff requests"
            />
            <div className="welcome-illustration-blur"></div>
          </div>
        </div>
      </section>

      {/* Success/Error Messages */}
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <section className="requests-stats">
        <div className="stats-grid modern">
          {statCards.map(({ title, value, icon: IconComponent, accent }) => (
            <div key={title} className={`stat-card-modern ${accent}`}>
              
              <div>
                <p className="stat-label">{title}</p>
                <p className="stat-value">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="requests-filter-card">
        <div className="filter-left">
          
          <div>
            <h3>Lọc theo trạng thái</h3>
            <p>Đang hiển thị {filteredRequests.length} / {stats.total} yêu cầu</p>
          </div>
        </div>
        <select
          className="modern-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {filterOptions.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </section>

      <section className="requests-table-card">
        <div className="section-header">
          <h2>Danh sách yêu cầu</h2>
          <span className="badge badge-pill">{filterLabel}</span>
        </div>

        <div className="table-responsive modern">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Khu vực</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Ghi chú</th>
                <th>QTV phản hồi</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state modern">
                      <div className="empty-icon">📭</div>
                      <h4>Không có yêu cầu nào</h4>
                      <p>Tạo yêu cầu mới để bắt đầu.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>{request.employeeName}</strong>
                    </td>
                    <td>{request.employeeEmail}</td>
                    <td>{request.employeePhone || '-'}</td>
                    <td>{request.responsibleArea || '-'}</td>
                    <td>
                      <span className={`order-status-badge ${getStatusBadge(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td>{new Date(request.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="truncate" title={request.requestNote}>
                      {request.requestNote || '-'}
                    </td>
                    <td className="truncate" title={request.adminResponse}>
                      {request.adminResponse || '-'}
                    </td>
                    <td>
                      <div className="table-actions">
                        {request.status === 'pending' ? (
                          <>
                            <button className="icon-btn edit" onClick={() => handleOpenModal(request)} title="Chỉnh sửa">
                              <Edit3 size={16} />
                            </button>
                            <button className="icon-btn delete" onClick={() => handleCancel(request.id)} title="Hủy yêu cầu">
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <button className="icon-btn processed" onClick={() => handleMarkAsProcessed(request.id)}>
                            <CheckCheck size={16} />
                            Đã xử lý
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRequest ? 'Chỉnh Sửa Yêu Cầu' : 'Tạo Yêu Cầu Mới'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên Nhân Viên <span className="required">*</span></label>
                <input
                  type="text"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="employeeEmail"
                  value={formData.employeeEmail}
                  onChange={handleChange}
                  placeholder="employee@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Số Điện Thoại</label>
                <input
                  type="tel"
                  name="employeePhone"
                  value={formData.employeePhone}
                  onChange={handleChange}
                  placeholder="0912345678"
                />
              </div>

              <div className="form-group">
                <label>Khu Vực Phụ Trách</label>
                <input
                  type="text"
                  name="responsibleArea"
                  value={formData.responsibleArea}
                  onChange={handleChange}
                  placeholder="Quận 1, Quận 3, Bình Thạnh"
                />
              </div>

              <div className="form-group">
                <label>Lý Do Cần Thêm Nhân Viên</label>
                <textarea
                  name="requestNote"
                  value={formData.requestNote}
                  onChange={handleChange}
                  placeholder="Ví dụ: Số lượng booking tăng cao trong tháng này..."
                  rows="4"
                />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingRequest ? 'Cập Nhật' : 'Tạo Yêu Cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRequests;

