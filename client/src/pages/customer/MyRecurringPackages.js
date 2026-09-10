import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Calendar,
  Clock,
  MapPin,
  User,
  RefreshCw,
  Pause,
  Play,
  XCircle,
  SkipForward,
  CalendarClock,
  AlertCircle,
  CheckCircle,
  X,
  DollarSign,
  FileText,
} from 'lucide-react';
import { customerAPI } from '../../services/api';
import './Customer.css';

const STATUS_CONFIG = {
  active: { label: 'Đang hoạt động', className: 'pkg-badge pkg-badge-active', icon: CheckCircle },
  paused: { label: 'Tạm dừng', className: 'pkg-badge pkg-badge-paused', icon: Pause },
  cancelled: { label: 'Đã hủy', className: 'pkg-badge pkg-badge-cancelled', icon: XCircle },
};

const FREQ_LABELS = {
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
};

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const MyRecurringPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Reschedule modal state
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await customerAPI.getRecurringPackages();
      if (res.data.success) {
        setPackages(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load packages:', err);
      setError('Không thể tải danh sách gói định kỳ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    return timeStr.substring(0, 5);
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('vi-VN') + ' ₫';
  };

  // === Actions ===

  const handleUpdateStatus = async (packageId, status, label) => {
    setConfirmModal(null);
    setActionLoading(packageId);
    try {
      const res = await customerAPI.updateRecurringPackageStatus(packageId, { status });
      if (res.data.success) {
        showToast(`${label} thành công`);
        await fetchPackages();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (packageId) => {
    setConfirmModal(null);
    setActionLoading(packageId);
    try {
      const res = await customerAPI.skipRecurringSession(packageId);
      if (res.data.success) {
        showToast('Đã bỏ qua 1 buổi, lịch tiếp theo đã được cập nhật');
        await fetchPackages();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      showToast('Vui lòng chọn ngày và giờ mới', 'error');
      return;
    }
    const packageId = rescheduleModal.id;
    setRescheduleModal(null);
    setActionLoading(packageId);
    try {
      const res = await customerAPI.rescheduleRecurringSession(packageId, {
        booking_day: rescheduleDate,
        cleaning_time: rescheduleTime,
      });
      if (res.data.success) {
        showToast('Đổi lịch buổi tiếp theo thành công');
        await fetchPackages();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openRescheduleModal = (pkg) => {
    setRescheduleModal(pkg);
    const nextDate = pkg.nextBookingDate ? new Date(pkg.nextBookingDate).toISOString().split('T')[0] : '';
    setRescheduleDate(nextDate);
    setRescheduleTime(pkg.cleaningTime ? pkg.cleaningTime.substring(0, 5) : '08:00');
  };

  const openConfirmModal = (action, pkg) => {
    const configs = {
      pause: {
        title: 'Tạm dừng gói',
        message: `Bạn có chắc muốn tạm dừng gói "${pkg.serviceName}"? Các buổi trong tương lai sẽ không được thực hiện cho đến khi bạn kích hoạt lại.`,
        confirmLabel: 'Tạm dừng',
        confirmClass: 'pkg-btn-warning',
        onConfirm: () => handleUpdateStatus(pkg.id, 'paused', 'Tạm dừng gói'),
      },
      resume: {
        title: 'Kích hoạt lại gói',
        message: `Bạn có muốn kích hoạt lại gói "${pkg.serviceName}"?`,
        confirmLabel: 'Kích hoạt',
        confirmClass: 'pkg-btn-success',
        onConfirm: () => handleUpdateStatus(pkg.id, 'active', 'Kích hoạt gói'),
      },
      cancel: {
        title: 'Hủy gói định kỳ',
        message: `Bạn có chắc muốn hủy gói "${pkg.serviceName}"? Hành động này không thể hoàn tác.`,
        confirmLabel: 'Hủy gói',
        confirmClass: 'pkg-btn-danger',
        onConfirm: () => handleUpdateStatus(pkg.id, 'cancelled', 'Hủy gói'),
      },
      skip: {
        title: 'Bỏ qua buổi tiếp theo',
        message: `Bỏ qua buổi ngày ${formatDate(pkg.nextBookingDate)}? Lịch sẽ tự động chuyển sang buổi kế tiếp.`,
        confirmLabel: 'Bỏ qua',
        confirmClass: 'pkg-btn-warning',
        onConfirm: () => handleSkip(pkg.id),
      },
    };
    setConfirmModal(configs[action]);
  };

  // === Filter ===
  const [filter, setFilter] = useState('all');

  const filteredPackages = packages.filter((pkg) => {
    if (filter === 'all') return true;
    return pkg.status === filter;
  });

  const counts = {
    all: packages.length,
    active: packages.filter((p) => p.status === 'active').length,
    paused: packages.filter((p) => p.status === 'paused').length,
    cancelled: packages.filter((p) => p.status === 'cancelled').length,
  };

  // === Render ===

  if (loading) {
    return (
      <div className="customer-recurring-packages">
        <div className="contracts-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải gói định kỳ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-recurring-packages">
      {/* Toast */}
      {toast && (
        <div className={`pkg-toast ${toast.type === 'error' ? 'pkg-toast-error' : 'pkg-toast-success'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="pkg-page-header">
        <Link to="/customer/dashboard" className="back-link">
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </Link>
        <h1>
          <Package size={28} />
          Gói dịch vụ định kỳ
        </h1>
        <p className="pkg-page-subtitle">Quản lý các gói dọn dẹp định kỳ của bạn</p>
      </div>

      {error && (
        <div className="contracts-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      {packages.length > 0 && (
        <div className="pkg-filter-tabs">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'active', label: 'Đang hoạt động' },
            { key: 'paused', label: 'Tạm dừng' },
            { key: 'cancelled', label: 'Đã hủy' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`pkg-filter-tab ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              <span className="pkg-tab-count">{counts[tab.key]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {packages.length === 0 && !error ? (
        <div className="contracts-empty">
          <Package size={48} strokeWidth={1.5} />
          <h3>Chưa có gói định kỳ nào</h3>
          <p>Bạn có thể tạo gói định kỳ bằng cách đặt một buổi dùng thử, sau đó chuyển đổi sang gói định kỳ.</p>
          <Link to="/customer/book-service" className="btn btn-primary">
            Đặt dịch vụ
          </Link>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="contracts-empty">
          <Package size={48} strokeWidth={1.5} />
          <h3>Không có gói nào trong mục này</h3>
          <p>Thử chọn bộ lọc khác để xem các gói định kỳ của bạn.</p>
        </div>
      ) : (
        <div className="pkg-list">
          {filteredPackages.map((pkg) => {
            const statusInfo = STATUS_CONFIG[pkg.status] || STATUS_CONFIG.active;
            const StatusIcon = statusInfo.icon;
            const isActionLoading = actionLoading === pkg.id;

            return (
              <div className={`pkg-card ${pkg.status === 'cancelled' ? 'pkg-card-cancelled' : ''}`} key={pkg.id}>
                {/* Card Header */}
                <div className="pkg-card-header">
                  <div className="pkg-card-header-left">
                    <div className="pkg-service-icon">
                      <RefreshCw size={20} />
                    </div>
                    <div>
                      <h3 className="pkg-service-name">{pkg.serviceName || 'Dịch vụ định kỳ'}</h3>
                      <span className="pkg-frequency-label">
                        {FREQ_LABELS[pkg.frequency] || pkg.frequency}
                        {pkg.frequency === 'weekly' && pkg.dayOfWeek != null && ` • ${DAY_NAMES[pkg.dayOfWeek]}`}
                        {pkg.frequency === 'monthly' && pkg.dayOfMonth && ` • Ngày ${pkg.dayOfMonth}`}
                      </span>
                    </div>
                  </div>
                  <span className={statusInfo.className}>
                    <StatusIcon size={14} />
                    {statusInfo.label}
                  </span>
                </div>

                {/* Card Body */}
                <div className="pkg-card-body">
                  <div className="pkg-info-grid">
                    <div className="pkg-info-item">
                      <Calendar size={16} />
                      <div>
                        <span className="pkg-info-label">Buổi tiếp theo</span>
                        <span className="pkg-info-value">
                          {pkg.status === 'cancelled' ? '—' : formatDate(pkg.nextBookingDate)}
                        </span>
                      </div>
                    </div>
                    <div className="pkg-info-item">
                      <Clock size={16} />
                      <div>
                        <span className="pkg-info-label">Giờ làm việc</span>
                        <span className="pkg-info-value">{formatTime(pkg.cleaningTime)}</span>
                      </div>
                    </div>
                    <div className="pkg-info-item">
                      <MapPin size={16} />
                      <div>
                        <span className="pkg-info-label">Địa chỉ</span>
                        <span className="pkg-info-value">{pkg.address || '—'}</span>
                      </div>
                    </div>
                    <div className="pkg-info-item">
                      <DollarSign size={16} />
                      <div>
                        <span className="pkg-info-label">Phí/buổi</span>
                        <span className="pkg-info-value pkg-fee">{formatCurrency(pkg.totalFee)}</span>
                      </div>
                    </div>
                    {pkg.preferredEmployeeName && (
                      <div className="pkg-info-item">
                        <User size={16} />
                        <div>
                          <span className="pkg-info-label">NV ưu tiên</span>
                          <span className="pkg-info-value">{pkg.preferredEmployeeName}</span>
                        </div>
                      </div>
                    )}
                    {pkg.note && (
                      <div className="pkg-info-item pkg-info-full">
                        <FileText size={16} />
                        <div>
                          <span className="pkg-info-label">Ghi chú</span>
                          <span className="pkg-info-value">{pkg.note}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                {pkg.status !== 'cancelled' && (
                  <div className="pkg-card-actions">
                    {pkg.status === 'active' && (
                      <>
                        <button
                          className="pkg-action-btn pkg-btn-outline"
                          onClick={() => openConfirmModal('skip', pkg)}
                          disabled={isActionLoading}
                          title="Bỏ qua buổi tiếp theo"
                        >
                          <SkipForward size={15} />
                          Bỏ qua buổi
                        </button>
                        <button
                          className="pkg-action-btn pkg-btn-outline"
                          onClick={() => openRescheduleModal(pkg)}
                          disabled={isActionLoading}
                          title="Đổi lịch buổi tiếp theo"
                        >
                          <CalendarClock size={15} />
                          Đổi lịch
                        </button>
                        <button
                          className="pkg-action-btn pkg-btn-warning"
                          onClick={() => openConfirmModal('pause', pkg)}
                          disabled={isActionLoading}
                          title="Tạm dừng gói"
                        >
                          <Pause size={15} />
                          Tạm dừng
                        </button>
                      </>
                    )}
                    {pkg.status === 'paused' && (
                      <button
                        className="pkg-action-btn pkg-btn-success"
                        onClick={() => openConfirmModal('resume', pkg)}
                        disabled={isActionLoading}
                        title="Kích hoạt lại gói"
                      >
                        <Play size={15} />
                        Kích hoạt lại
                      </button>
                    )}
                    {(pkg.status === 'active' || pkg.status === 'paused') && (
                      <button
                        className="pkg-action-btn pkg-btn-danger-outline"
                        onClick={() => openConfirmModal('cancel', pkg)}
                        disabled={isActionLoading}
                        title="Hủy gói"
                      >
                        <XCircle size={15} />
                        Hủy gói
                      </button>
                    )}
                    {isActionLoading && (
                      <div className="pkg-action-loading">
                        <div className="loading-spinner-sm"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="pkg-modal-overlay" onClick={() => setRescheduleModal(null)}>
          <div className="pkg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header">
              <h3>
                <CalendarClock size={20} />
                Đổi lịch buổi tiếp theo
              </h3>
              <button className="pkg-modal-close" onClick={() => setRescheduleModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="pkg-modal-body">
              <p className="pkg-modal-desc">
                Đổi lịch buổi tiếp theo của gói <strong>{rescheduleModal.serviceName}</strong>
              </p>
              <div className="pkg-form-group">
                <label>Ngày mới</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="pkg-form-input"
                />
              </div>
              <div className="pkg-form-group">
                <label>Giờ mới</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  min="07:00"
                  max="20:00"
                  className="pkg-form-input"
                />
              </div>
            </div>
            <div className="pkg-modal-footer">
              <button className="pkg-action-btn pkg-btn-outline" onClick={() => setRescheduleModal(null)}>
                Hủy bỏ
              </button>
              <button className="pkg-action-btn pkg-btn-primary" onClick={handleReschedule}>
                <CalendarClock size={15} />
                Xác nhận đổi lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="pkg-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="pkg-modal pkg-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header">
              <h3>{confirmModal.title}</h3>
              <button className="pkg-modal-close" onClick={() => setConfirmModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="pkg-modal-body">
              <p className="pkg-modal-desc">{confirmModal.message}</p>
            </div>
            <div className="pkg-modal-footer">
              <button className="pkg-action-btn pkg-btn-outline" onClick={() => setConfirmModal(null)}>
                Không, quay lại
              </button>
              <button className={`pkg-action-btn ${confirmModal.confirmClass}`} onClick={confirmModal.onConfirm}>
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRecurringPackages;
