import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { employeeAPI } from '../../services/api';
import './Employee.css';

const normalizeStatusKey = (status = '') =>
  status
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');

const pendingStatusKeys = ['pending', 'confirmed', 'booked', 'processing'];

const parseBookingDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const isoCandidate = value.replace(' ', 'T');
  const autoDate = new Date(isoCandidate);
  if (!isNaN(autoDate.getTime())) return autoDate;

  const [datePart, timePart] = value.split(' ');
  const [year, month, day] = (datePart || '').split(/[-/]/).map(Number);
  if (!year || !month || !day) return null;
  const [hour = 0, minute = 0, second = 0] = (timePart || '').split(':').map(Number);
  return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
};

const getAccessMethodLabel = (method) => {
  const map = {
    lockbox: 'Hộp khóa cơ học',
    condo_gate: 'Cổng chung cư',
    both: 'Lockbox + Chung cư',
    none: 'Không có',
  };
  return map[method] || method;
};

const EmployeeJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [updatingJob, setUpdatingJob] = useState(null);
  const [accessByJob, setAccessByJob] = useState({});
  const [loadingAccessFor, setLoadingAccessFor] = useState(null);
  const location = useLocation();
  const highlightJobId = location.state?.highlightJobId;

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!highlightJobId || jobs.length === 0) return;
    const targetJob = jobs.find((job) => job.id === highlightJobId);
    if (!targetJob) return;

    if (pendingStatusKeys.includes(targetJob.statusKey)) {
      setActiveTab('pending');
    } else if (targetJob.statusKey === 'in_progress') {
      setActiveTab('in-progress');
    } else if (targetJob.statusKey === 'completed') {
      setActiveTab('completed');
    } else {
      setActiveTab('all');
    }

    setTimeout(() => {
      const element = document.getElementById(`employee-job-${highlightJobId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }, [highlightJobId, jobs]);

  const filterJobs = useCallback(() => {
    if (activeTab === 'all') {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(job => {
        if (activeTab === 'pending') {
          return pendingStatusKeys.includes(job.statusKey);
        } else if (activeTab === 'in-progress') {
          return job.statusKey === 'in_progress';
        } else if (activeTab === 'completed') {
          return job.statusKey === 'completed';
        }
        return true;
      });
      setFilteredJobs(filtered);
    }
  }, [activeTab, jobs]);

  useEffect(() => {
    filterJobs();
  }, [filterJobs]);

  const loadJobs = async () => {
    try {
      const response = await employeeAPI.viewAssignedJobs();
      if (response.data.success) {
        const normalizedJobs = (response.data.data || []).map(job => ({
          ...job,
          statusKey: normalizeStatusKey(job.status),
        }));
        setJobs(normalizedJobs);
      }
    } catch (error) {
      console.error('Lỗi khi tải công việc:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (jobId) => {
    try {
      setUpdatingJob(jobId);
      await employeeAPI.checkInJob(jobId);
      await loadJobs();
      // Xóa trạng thái cũ (nếu đã bị từ chối trước đó) rồi tự động mở khóa thông tin truy cập
      setAccessByJob((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      alert('Check-in thành công');
      await handleRevealAccess(jobId);
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể check-in');
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleCheckOut = async (jobId) => {
    try {
      setUpdatingJob(jobId);
      await employeeAPI.checkOutJob(jobId);
      setAccessByJob((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      await loadJobs();
      alert('Check-out thành công. Thông tin truy cập đã được ẩn.');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể check-out');
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleRevealAccess = async (jobId) => {
    try {
      setLoadingAccessFor(jobId);
      const response = await employeeAPI.getJobAccess(jobId);
      if (response.data?.success) {
        setAccessByJob((prev) => ({
          ...prev,
          [jobId]: { ...response.data.data, status: 'unlocked' },
        }));
      } else {
        setAccessByJob((prev) => ({
          ...prev,
          [jobId]: { ...(response.data?.data || {}), status: 'locked' },
        }));
      }
    } catch (error) {
      const payload = error.response?.data;
      setAccessByJob((prev) => ({
        ...prev,
        [jobId]: { ...(payload?.data || {}), status: 'locked', message: payload?.message || 'Không thể xem thông tin truy cập' },
      }));
    } finally {
      setLoadingAccessFor(null);
    }
  };

  const handleHideAccess = (jobId) => {
    setAccessByJob((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
  };

  const getStatusBadge = (statusKey) => {
    const badges = {
      'pending': 'badge-warning',
      'confirmed': 'badge-info',
      'booked': 'badge-info',
      'processing': 'badge-info',
      'in_progress': 'badge-primary',
      'completed': 'badge-success',
      'cancelled': 'badge-danger'
    };
    return badges[statusKey] || 'badge-secondary';
  };

  const getStatusText = (statusKey) => {
    const texts = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'booked': 'Đã đặt',
      'processing': 'Đang xử lý',
      'in_progress': 'Đang thực hiện',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return texts[statusKey] || statusKey;
  };

  const tabs = [
    { key: 'all', label: 'Tất cả', count: jobs.length },
    { key: 'pending', label: 'Chờ xử lý', count: jobs.filter(j => pendingStatusKeys.includes(j.statusKey)).length },
    { key: 'in-progress', label: 'Đang làm', count: jobs.filter(j => j.statusKey === 'in_progress').length },
    { key: 'completed', label: 'Hoàn thành', count: jobs.filter(j => j.statusKey === 'completed').length }
  ];

  return (
    <div className="employee-jobs">
      <div className="page-header">
        <h1>Công Việc Của Tôi</h1>
        <p className="text-muted">Quản lý các công việc được phân công</p>
      </div>

      {/* Tabs */}
      <div className="booking-tabs mb-4">
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
          <p className="mt-3">Đang tải công việc...</p>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="jobs-list">
          {filteredJobs.map(job => {
            return (
              <div key={job.id} id={`employee-job-${job.id}`} className="job-item">
                <div className="job-item-header">
                  <div>
                    <h3 className="job-service-name">
                      <span className="job-id">#{job.id}</span>
                      {job.serviceName}
                    </h3>
                    <p className="job-date">
                      
                      {parseBookingDate(job.bookingDate || job.bookingDay)?.toLocaleDateString('vi-VN') || '—'} -{' '}
                      {job.cleaningTime}
                    </p>
                  </div>
                  <div className="job-badges">
                    <span className={`badge ${getStatusBadge(job.statusKey)}`}>
                      {getStatusText(job.statusKey)}
                    </span>
                  </div>
                </div>

                <div className="job-item-body">
                  <div className="job-info-grid">
                    <div className="job-info-item">
                      
                      <div>
                        <span className="label">Khách hàng:</span>
                        <span className="value">{job.customerName}</span>
                      </div>
                    </div>

                    <div className="job-info-item">
                      
                      <div>
                        <span className="label">Số điện thoại:</span>
                        <span className="value">{job.customerPhone || 'Chưa có'}</span>
                      </div>
                    </div>

                    <div className="job-info-item full-width">
                      
                      <div>
                        <span className="label">Địa chỉ:</span>
                        <span className="value">{job.address}</span>
                      </div>
                    </div>

                    {job.note && (
                      <div className="job-info-item full-width">
                        
                        <div>
                          <span className="label">Ghi chú:</span>
                          <span className="value">{job.note}</span>
                        </div>
                      </div>
                    )}

                    {job.specialInstructions && (
                      <div className="job-info-item full-width">
                        <div>
                          <span className="label">Ghi chú đặc biệt:</span>
                          <span className="value">{job.specialInstructions}</span>
                        </div>
                      </div>
                    )}

                    <div className="job-info-item">
                      
                      <div>
                        <span className="label">Tổng tiền:</span>
                        <span className="value font-weight-bold">{job.totalFee?.toLocaleString()} VNĐ</span>
                      </div>
                    </div>

                    <div className="job-info-item">
                      
                      <div>
                        <span className="label">Thanh toán:</span>
                        <span className="value">
                          {job.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                          {job.paymentStatus === 'paid' && ' (Đã thanh toán)'}
                        </span>
                      </div>
                    </div>
                    <div className="job-info-item">
                      <div>
                        <span className="label">Check-in/out:</span>
                        <span className="value">
                          {job.checkInTime ? `IN ${new Date(job.checkInTime).toLocaleTimeString('vi-VN')}` : 'Chưa check-in'}
                          {job.checkOutTime ? ` | OUT ${new Date(job.checkOutTime).toLocaleTimeString('vi-VN')}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Home Access section */}
                  {(Number(job.hasAccessInfo) === 1 || job.hasAccessInfo === true) && (
                    <div
                      className="mt-3 p-3 border rounded"
                      style={{
                        background: accessByJob[job.id]?.status === 'unlocked' ? '#fff8e1' : '#f5f5f5',
                        borderColor: accessByJob[job.id]?.status === 'unlocked' ? '#ffb300' : '#ddd',
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <strong>
                          🔐 Thông tin truy cập bảo mật —{' '}
                          <span className="text-muted">{getAccessMethodLabel(job.accessMethodSnapshot)}</span>
                        </strong>
                        {accessByJob[job.id]?.status === 'unlocked' ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleHideAccess(job.id)}
                          >
                            Ẩn đi
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-warning"
                            onClick={() => handleRevealAccess(job.id)}
                            disabled={loadingAccessFor === job.id || !!job.checkOutTime}
                          >
                            {loadingAccessFor === job.id ? 'Đang xác thực...' : '👁 Xem thông tin truy cập'}
                          </button>
                        )}
                      </div>

                      {!accessByJob[job.id] && !job.checkOutTime && (
                        <p className="mb-0 text-muted small">
                          {job.checkInTime
                            ? 'Bạn đã check-in. Nhấn để xem mã lockbox và thông tin truy cập căn hộ.'
                            : <>Thông tin này đã được mã hóa. Bạn chỉ có thể xem trong vòng <strong>30 phút trước giờ làm</strong> hoặc sau khi check-in.</>}
                        </p>
                      )}

                      {job.checkOutTime && !accessByJob[job.id] && (
                        <p className="mb-0 text-danger small">
                          Bạn đã check-out, thông tin truy cập đã bị khóa vĩnh viễn.
                        </p>
                      )}

                      {accessByJob[job.id]?.status === 'locked' && (
                        <div className="alert alert-warning mb-0 mt-2 py-2 small">
                          <strong>Chưa thể xem.</strong>{' '}
                          {accessByJob[job.id]?.message ||
                            (accessByJob[job.id]?.reason === 'too_early'
                              ? `Thời gian mở khóa: ${
                                  accessByJob[job.id]?.revealAt
                                    ? new Date(accessByJob[job.id].revealAt).toLocaleString('vi-VN')
                                    : 'Trước giờ làm 30 phút'
                                }`
                              : 'Không đủ điều kiện xem thông tin.')}
                        </div>
                      )}

                      {accessByJob[job.id]?.status === 'unlocked' && (
                        <div className="mt-2">
                          <div className="alert alert-warning py-2 mb-2 small">
                            ⚠️ {accessByJob[job.id].warning || 'Tuyệt đối bảo mật: Không chia sẻ cho người khác.'}
                          </div>
                          {accessByJob[job.id].lockboxLocation && (
                            <div className="mb-2">
                              <span className="label text-muted">Vị trí hộp khóa:</span>{' '}
                              <strong>{accessByJob[job.id].lockboxLocation}</strong>
                            </div>
                          )}
                          {accessByJob[job.id].lockboxPin && (
                            <div className="mb-2">
                              <span className="label text-muted">Mã PIN:</span>{' '}
                              <strong
                                style={{
                                  fontSize: '1.4rem',
                                  letterSpacing: '4px',
                                  color: '#d32f2f',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {accessByJob[job.id].lockboxPin}
                              </strong>
                            </div>
                          )}
                          {accessByJob[job.id].condoGuide && (
                            <div className="mb-2">
                              <span className="label text-muted">Hướng dẫn vào chung cư:</span>
                              <div
                                className="mt-1 p-2 bg-white border rounded"
                                style={{ whiteSpace: 'pre-wrap' }}
                              >
                                {accessByJob[job.id].condoGuide}
                              </div>
                            </div>
                          )}
                          {accessByJob[job.id].accessNote && (
                            <div className="mb-2">
                              <span className="label text-muted">Ghi chú bổ sung:</span>
                              <div
                                className="mt-1 p-2 bg-white border rounded"
                                style={{ whiteSpace: 'pre-wrap' }}
                              >
                                {accessByJob[job.id].accessNote}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="job-item-footer">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => handleCheckIn(job.id)}
                    disabled={!!job.checkInTime || updatingJob === job.id}
                  >
                    {updatingJob === job.id && !job.checkInTime ? 'Đang xử lý...' : 'Check-in'}
                  </button>
                  <button
                    className="btn btn-outline-success"
                    onClick={() => handleCheckOut(job.id)}
                    disabled={!job.checkInTime || !!job.checkOutTime || updatingJob === job.id}
                  >
                    {updatingJob === job.id && job.checkInTime && !job.checkOutTime ? 'Đang xử lý...' : 'Check-out'}
                  </button>
                  {job.statusKey === 'completed' && (
                    <span className="text-success">✅ Công việc đã hoàn thành</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          
          <h4>Không có công việc nào</h4>
          <p>
            {activeTab === 'all' 
              ? 'Bạn chưa được phân công công việc nào.' 
              : 'Không có công việc nào trong danh mục này'}
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeJobs;

