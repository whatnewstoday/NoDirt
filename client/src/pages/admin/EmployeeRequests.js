import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import './Admin.css';

const EmployeeRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalType, setModalType] = useState(''); // 'approve' or 'reject'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    adminResponse: '',
    password: '',
    createEmployee: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsRes, statsRes] = await Promise.all([
        adminAPI.getAllEmployeeRequests(),
        adminAPI.getEmployeeRequestStats()
      ]);

      console.log('Admin - Requests Response:', requestsRes);
      console.log('Admin - Stats Response:', statsRes);

      if (requestsRes.data.success) {
        console.log('Admin - Requests Data:', requestsRes.data.data);
        setRequests(requestsRes.data.data);
      }

      if (statsRes.data.success) {
        console.log('Admin - Stats Data:', statsRes.data.data);
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Admin - Error:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (request, type) => {
    setSelectedRequest(request);
    setModalType(type);
    setFormData({
      adminResponse: '',
      password: type === 'approve' ? 'employee123' : '',
      createEmployee: type === 'approve'
    });
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setModalType('');
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (modalType === 'approve') {
      // Validation for approval
      if (formData.createEmployee && !formData.password.trim()) {
        setError('Vui lòng nhập mật khẩu cho nhân viên mới');
        return;
      }

      try {
        await adminAPI.approveEmployeeRequest(selectedRequest.id, {
          adminResponse: formData.adminResponse || 'Đã phê duyệt',
          createEmployee: formData.createEmployee,
          password: formData.password
        });

        setSuccess(
          formData.createEmployee 
            ? 'Đã phê duyệt và tạo nhân viên thành công!' 
            : 'Đã phê duyệt yêu cầu!'
        );
        handleCloseModal();
        loadData();
        setTimeout(() => setSuccess(''), 5000);
      } catch (err) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt');
      }
    } else if (modalType === 'reject') {
      // Validation for rejection
      if (!formData.adminResponse.trim()) {
        setError('Vui lòng nhập lý do từ chối');
        return;
      }

      try {
        await adminAPI.rejectEmployeeRequest(selectedRequest.id, {
          adminResponse: formData.adminResponse
        });

        setSuccess('Đã từ chối yêu cầu');
        handleCloseModal();
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối');
      }
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'approved') return 'đã duyệt';
    if (status === 'rejected') return 'từ chối';
    return 'chờ duyệt';
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'approved') return 'order-status-completed';
    if (status === 'rejected') return 'order-status-cancelled';
    return 'order-status-upcoming';
  };

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter(req => req.status === filter);
  }, [requests, filter]);

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

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <>
      <div className="admin-dashboard admin-dashboard-modern">
      <div className="admin-dashboard-shell">
        <section className="welcome-section admin requests">
          <div className="welcome-overlay"></div>
          <div className="welcome-content">
            <div className="welcome-text">
              <p className="welcome-subtitle">Quản lý yêu cầu nhân viên</p>
              <h1 className="welcome-title">Duyệt đề xuất từ manager</h1>
              <p className="welcome-description">
                Giữ luồng nhân sự ổn định bằng cách xử lý các yêu cầu bổ sung nhân viên kịp thời.
              </p>
              <button className="btn btn-primary hero-btn" onClick={loadData}>
                <ShieldCheck size={18} />
                <span>Tải lại dữ liệu</span>
              </button>
            </div>
            <div className="welcome-illustration">
              <img
                src="https://images.unsplash.com/photo-1507207632278-86efb61fe095?auto=format&fit=crop&w=600&q=80"
                alt="Admin requests"
              />
              <div className="welcome-illustration-blur"></div>
            </div>
          </div>
        </section>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <section className="stats-section">
          <div className="section-heading">
            <h2>Tổng quan yêu cầu</h2>
          </div>
          <div className="stats-grid modern">
            {statCards.map(({ title, value, icon: IconComponent, accent }) => (
              <div key={title} className={`stat-card-modern ${accent}`}>
                <div className="stat-icon-modern">
                  <IconComponent size={22} />
                </div>
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
            <div className="filter-icon admin">
              <Filter size={18} />
            </div>
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
          </div>

          <div className="table-responsive modern">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Nhân viên đề xuất</th>
                  <th>Liên hệ</th>
                  <th>Khu vực</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
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
                        <p>Chọn trạng thái khác hoặc chờ yêu cầu mới.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="manager-info">
                          <strong>{request.managerName}</strong>
                          <span>{request.managerEmail}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{request.employeeName}</strong>
                          <div className="contact-row">
                            <Mail size={14} /> {request.employeeEmail}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-row">
                          <Phone size={14} /> {request.employeePhone || '-'}
                        </div>
                      </td>
                      <td>
                        <div className="contact-row">
                          <MapPin size={14} /> {request.responsibleArea || '-'}
                        </div>
                      </td>
                      <td className="truncate" title={request.requestNote}>
                        {request.requestNote || '-'}
                      </td>
                      <td>
                        <span className={`order-status-badge ${getStatusBadgeClass(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td>{new Date(request.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="table-actions">
                          {request.status === 'pending' ? (
                            <>
                              <button
                                className="icon-btn edit"
                                onClick={() => handleOpenModal(request, 'approve')}
                                title="Phê duyệt"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                className="icon-btn delete"
                                onClick={() => handleOpenModal(request, 'reject')}
                                title="Từ chối"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="processed-note">
                              <ShieldCheck size={14} /> Đã xử lý
                            </span>
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

      </div>
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'approve' ? '✓ Phê Duyệt Yêu Cầu' : '✗ Từ Chối Yêu Cầu'}
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', marginBottom: '20px', borderRadius: '5px' }}>
              <h4 style={{ marginTop: 0 }}>Thông Tin Yêu Cầu:</h4>
              <p><strong>Manager:</strong> {selectedRequest.managerName} ({selectedRequest.managerEmail})</p>
              <p><strong>Nhân viên đề xuất:</strong> {selectedRequest.employeeName}</p>
              <p><strong>Email:</strong> {selectedRequest.employeeEmail}</p>
              <p><strong>SĐT:</strong> {selectedRequest.employeePhone || 'Không có'}</p>
              <p><strong>Khu vực:</strong> {selectedRequest.responsibleArea || 'Không xác định'}</p>
              {selectedRequest.requestNote && (
                <p><strong>Lý do:</strong> <em>{selectedRequest.requestNote}</em></p>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              {modalType === 'approve' && (
                <>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        name="createEmployee"
                        checked={formData.createEmployee}
                        onChange={handleChange}
                      />
                      <span>Tạo nhân viên ngay lập tức</span>
                    </label>
                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                      Nếu bỏ chọn, bạn có thể tạo nhân viên thủ công sau
                    </small>
                  </div>

                  {formData.createEmployee && (
                    <div className="form-group">
                      <label>Mật khẩu cho nhân viên mới <span className="required">*</span></label>
                      <input
                        type="text"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu"
                        required={formData.createEmployee}
                      />
                      <small style={{ color: '#666' }}>
                        Mật khẩu mặc định: employee123
                      </small>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Ghi chú</label>
                    <textarea
                      name="adminResponse"
                      value={formData.adminResponse}
                      onChange={handleChange}
                      placeholder="Ghi chú cho manager (không bắt buộc)"
                      rows="3"
                    />
                  </div>
                </>
              )}

              {modalType === 'reject' && (
                <div className="form-group">
                  <label>Lý do từ chối <span className="required">*</span></label>
                  <textarea
                    name="adminResponse"
                    value={formData.adminResponse}
                    onChange={handleChange}
                    placeholder="Vui lòng nhập lý do từ chối..."
                    rows="4"
                    required
                  />
                </div>
              )}

              {error && <div className="alert alert-error">{error}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className={modalType === 'approve' ? 'btn-primary' : 'btn-danger'}
                  style={{
                    backgroundColor: modalType === 'approve' ? '#28a745' : '#dc3545'
                  }}
                >
                  {modalType === 'approve' ? '✓ Phê Duyệt' : '✗ Từ Chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeRequests;

