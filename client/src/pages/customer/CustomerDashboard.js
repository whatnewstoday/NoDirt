import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  Loader,
  CheckCircle,
  Eye,
  Plus,
  List,
  Calendar,
  MapPin,
  Lock,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Customer.css';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    inProgress: 0
  });
  const [summary, setSummary] = useState({
    upcoming: 0,
    sessionsUsed: 0,
    totalSpent: 0,
    activePackages: 0
  });
  const [profileForm, setProfileForm] = useState({
    homeSizeSqm: '',
    priorityAreas: '',
    hasPets: false,
    petNotes: '',
    defaultAddress: '',
    defaultTime: '',
    specialInstructions: ''
  });
  const [accessForm, setAccessForm] = useState({
    accessMethod: 'none',
    lockboxLocation: '',
    lockboxPin: '',
    condoGuide: '',
    accessNote: '',
    keepExistingPin: false,
    keepExistingCondo: false,
    keepExistingNote: false,
  });
  const [accessInfo, setAccessInfo] = useState({
    hasLockboxPin: false,
    lockboxPinMasked: null,
    hasCondoGuide: false,
    hasAccessNote: false,
  });
  const [savingAccess, setSavingAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const [bookingRes, summaryRes] = await Promise.all([
        customerAPI.getBookings(),
        customerAPI.getDashboardSummary()
      ]);
      if (bookingRes.data.success) {
        const bookingsData = bookingRes.data.data || [];
        setBookings(bookingsData.slice(0, 6));

        const calculatedStats = {
          total: bookingsData.length,
          upcoming: bookingsData.filter(b => b.status === 'booked' || b.status === 'confirmed' || b.status === 'processing').length,
          completed: bookingsData.filter(b => b.status === 'completed').length,
          inProgress: bookingsData.filter(b => b.status === 'in progress').length
        };
        setStats(calculatedStats);
      }
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data || {
          upcoming: 0,
          sessionsUsed: 0,
          totalSpent: 0,
          activePackages: 0
        });
      }
      const profileRes = await customerAPI.getServiceProfile();
      if (profileRes.data.success && profileRes.data.data) {
        const p = profileRes.data.data;
        setProfileForm({
          homeSizeSqm: p.homeSizeSqm || '',
          priorityAreas: p.priorityAreas || '',
          hasPets: !!p.hasPets,
          petNotes: p.petNotes || '',
          defaultAddress: p.defaultAddress || '',
          defaultTime: p.defaultTime ? p.defaultTime.slice(0, 5) : '',
          specialInstructions: p.specialInstructions || ''
        });
      }
      try {
        const accessRes = await customerAPI.getAccessProfile();
        if (accessRes.data.success && accessRes.data.data) {
          const a = accessRes.data.data;
          setAccessInfo({
            hasLockboxPin: !!a.hasLockboxPin,
            lockboxPinMasked: a.lockboxPinMasked || null,
            hasCondoGuide: !!a.hasCondoGuide,
            hasAccessNote: !!a.hasAccessNote,
          });
          setAccessForm((prev) => ({
            ...prev,
            accessMethod: a.accessMethod || 'none',
            lockboxLocation: a.lockboxLocation || '',
            lockboxPin: '',
            condoGuide: '',
            accessNote: '',
            keepExistingPin: !!a.hasLockboxPin,
            keepExistingCondo: !!a.hasCondoGuide,
            keepExistingNote: !!a.hasAccessNote,
          }));
        }
      } catch (accessErr) {
        console.error('Access profile load error:', accessErr);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  const loyaltyPoints = useMemo(() => Math.max(stats.total * 50, 250), [stats.total]);
  const membershipTier = useMemo(() => {
    if (stats.total >= 20) return 'Vàng';
    if (stats.total >= 10) return 'Bạc';
    return 'Đồng';
  }, [stats.total]);

  const statCards = [
    {
      title: 'Tổng đơn hàng',
      value: stats.total,
      icon: ShoppingBag,
      accent: 'stat-blue'
    },
    {
      title: 'Sắp tới',
      value: stats.upcoming,
      icon: Clock,
      accent: 'stat-orange'
    },
    {
      title: 'Đang thực hiện',
      value: stats.inProgress,
      icon: Loader,
      accent: 'stat-purple'
    },
    {
      title: 'Hoàn thành',
      value: stats.completed,
      icon: CheckCircle,
      accent: 'stat-green'
    }
  ];

  const quickActions = [
    {
      title: 'Xem dịch vụ',
      description: 'Khám phá các dịch vụ của chúng tôi',
      icon: Eye,
      to: '/customer/services',
      accent: 'action-blue'
    },
    {
      title: 'Đặt dịch vụ mới',
      description: 'Đặt lịch dọn dẹp ngay',
      icon: Plus,
      to: '/customer/book-service',
      accent: 'action-green'
    },
    {
      title: 'Đơn hàng của tôi',
      description: 'Theo dõi trạng thái và lịch sử',
      icon: List,
      to: '/customer/bookings',
      accent: 'action-purple'
    }
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'booked':
      case 'processing':
        return 'order-status-upcoming';
      case 'in progress':
        return 'order-status-progress';
      case 'completed':
        return 'order-status-completed';
      case 'cancelled':
        return 'order-status-cancelled';
      default:
        return 'order-status-default';
    }
  };

  const getStatusText = (status) => {
    const texts = {
      booked: 'Đã đặt',
      processing: 'Đang xử lý',
      'in progress': 'Đang thực hiện',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  const recentBookings = bookings.slice(0, 3);

  const saveServiceProfile = async () => {
    try {
      await customerAPI.upsertServiceProfile(profileForm);
      alert('Đã lưu hồ sơ dịch vụ');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể lưu hồ sơ dịch vụ');
    }
  };

  const saveAccessProfile = async () => {
    try {
      setSavingAccess(true);
      const payload = {
        accessMethod: accessForm.accessMethod,
        lockboxLocation: accessForm.lockboxLocation,
        lockboxPin: accessForm.lockboxPin,
        condoGuide: accessForm.condoGuide,
        accessNote: accessForm.accessNote,
        keepExistingPin: accessForm.keepExistingPin && !accessForm.lockboxPin,
        keepExistingCondo: accessForm.keepExistingCondo && !accessForm.condoGuide,
        keepExistingNote: accessForm.keepExistingNote && !accessForm.accessNote,
      };
      const res = await customerAPI.upsertAccessProfile(payload);
      if (res.data.success) {
        alert('Đã lưu thông tin truy cập (đã mã hóa)');
        const refresh = await customerAPI.getAccessProfile();
        if (refresh.data.success && refresh.data.data) {
          const a = refresh.data.data;
          setAccessInfo({
            hasLockboxPin: !!a.hasLockboxPin,
            lockboxPinMasked: a.lockboxPinMasked || null,
            hasCondoGuide: !!a.hasCondoGuide,
            hasAccessNote: !!a.hasAccessNote,
          });
          setAccessForm((prev) => ({
            ...prev,
            lockboxPin: '',
            condoGuide: '',
            accessNote: '',
            keepExistingPin: !!a.hasLockboxPin,
            keepExistingCondo: !!a.hasCondoGuide,
            keepExistingNote: !!a.hasAccessNote,
          }));
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể lưu thông tin truy cập');
    } finally {
      setSavingAccess(false);
    }
  };

  return (
    <div className="customer-dashboard">
      <section className="welcome-section">
        <div className="welcome-overlay"></div>
        <div className="welcome-content">
          <div className="welcome-text">
            <p className="welcome-subtitle">{greetingText},</p>
            <h1 className="welcome-title">{user?.name || 'Khách hàng'}! 👋</h1>
            <p className="welcome-description">
              Chào mừng bạn quay trở lại! Chúng tôi luôn sẵn sàng phục vụ bạn bất cứ lúc nào.
            </p>
            <div className="welcome-stats">
              <div className="welcome-stat-card">
                <span className="label">Điểm tích lũy</span>
                <span className="value">{loyaltyPoints.toLocaleString()} điểm</span>
              </div>
              <div className="welcome-stat-card">
                <span className="label">Hạng thành viên</span>
                <span className="value">{membershipTier}</span>
              </div>
            </div>
          </div>

          <div className="welcome-illustration">
            <img
              src="https://images.unsplash.com/photo-1580709510343-94c4027ac9b7?auto=format&fit=crop&w=600&q=80"
              alt="Customer welcome"
            />
            <div className="welcome-illustration-blur"></div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="section-heading">
          <h2>Tổng quan đơn hàng</h2>
        </div>
        <div className="stats-grid">
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
        <div className="stats-grid mt-3">
          <div className="stat-card-modern stat-blue">
            <div>
              <p className="stat-label">Lịch sắp tới</p>
              <p className="stat-value">{summary.upcoming}</p>
            </div>
          </div>
          <div className="stat-card-modern stat-green">
            <div>
              <p className="stat-label">Số buổi đã dùng</p>
              <p className="stat-value">{summary.sessionsUsed}</p>
            </div>
          </div>
          <div className="stat-card-modern stat-purple">
            <div>
              <p className="stat-label">Tổng chi tiêu</p>
              <p className="stat-value">{Number(summary.totalSpent || 0).toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
          <div className="stat-card-modern stat-orange">
            <div>
              <p className="stat-label">Gói định kỳ đang chạy</p>
              <p className="stat-value">{summary.activePackages}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-actions-modern">
        <div className="section-heading">
          <h2>Thao tác nhanh</h2>
        </div>
        <div className="quick-actions-grid">
          {quickActions.map(({ title, description, icon: IconComponent, to, accent }) => (
            <Link key={title} to={to} className={`action-card-modern ${accent}`}>
              <div className="action-icon-modern">
                <IconComponent size={26} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="recent-orders-section">
        <div className="section-header">
          <h2>Đơn hàng gần đây</h2>
          <Link to="/customer/bookings" className="btn btn-outline-primary btn-sm">
            Xem tất cả
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        ) : recentBookings.length > 0 ? (
          <div className="recent-orders-grid">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <h3>{booking.serviceName}</h3>
                    <p className="order-id">#{booking.id}</p>
                  </div>
                  <span className={`order-status-badge ${getStatusClass(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>

                <div className="order-info">
                  <div className="order-info-row">
                    <Calendar size={16} />
                    <span>{new Date(booking.bookingDay).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="order-info-row">
                    <Clock size={16} />
                    <span>{booking.cleaningTime}</span>
                  </div>
                  <div className="order-info-row">
                    <MapPin size={16} />
                    <span>{booking.address}</span>
                  </div>
                </div>

                <div className="order-card-footer">
                  <div className="order-total">
                    <span>Tổng tiền</span>
                    <strong>{booking.totalFee?.toLocaleString()} VNĐ</strong>
                  </div>
                  <Link to={`/customer/bookings/${booking.id}`} className="btn btn-outline-primary w-100">
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state modern">
            <div className="empty-icon">📭</div>
            <h4>Chưa có đơn hàng nào</h4>
            <p>Bắt đầu đặt dịch vụ dọn dẹp ngay hôm nay!</p>
            <Link to="/customer/services" className="btn btn-primary">
              Xem dịch vụ
            </Link>
          </div>
        )}
      </section>

      <section className="recent-orders-section">
        <div className="section-header">
          <h2>Hồ sơ dịch vụ cá nhân</h2>
        </div>
        <div className="card p-3">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Diện tích nhà (m²)</label>
              <input
                type="number"
                className="form-control"
                value={profileForm.homeSizeSqm}
                onChange={(e) => setProfileForm({ ...profileForm, homeSizeSqm: e.target.value })}
              />
            </div>
            <div className="col-md-8">
              <label className="form-label">Khu vực ưu tiên dọn</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.priorityAreas}
                onChange={(e) => setProfileForm({ ...profileForm, priorityAreas: e.target.value })}
                placeholder="Ví dụ: bếp, phòng khách"
              />
            </div>
            <div className="col-md-8">
              <label className="form-label">Địa chỉ mặc định</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.defaultAddress}
                onChange={(e) => setProfileForm({ ...profileForm, defaultAddress: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Giờ mặc định</label>
              <input
                type="time"
                className="form-control"
                value={profileForm.defaultTime}
                onChange={(e) => setProfileForm({ ...profileForm, defaultTime: e.target.value })}
              />
            </div>
            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hasPets"
                  checked={profileForm.hasPets}
                  onChange={(e) => setProfileForm({ ...profileForm, hasPets: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="hasPets">
                  Nhà có thú cưng
                </label>
              </div>
            </div>
            <div className="col-12">
              <label className="form-label">Ghi chú thú cưng</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.petNotes}
                onChange={(e) => setProfileForm({ ...profileForm, petNotes: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Ghi chú đặc biệt cho nhân viên</label>
              <textarea
                className="form-control"
                rows="2"
                value={profileForm.specialInstructions}
                onChange={(e) => setProfileForm({ ...profileForm, specialInstructions: e.target.value })}
              />
            </div>
            <div className="col-12">
              <button type="button" className="btn btn-primary" onClick={saveServiceProfile}>
                Lưu hồ sơ dịch vụ
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="service-profile-section mt-4">
        <div className="section-header">
          <h2 className="d-flex align-items-center gap-2">
            <ShieldCheck size={22} /> Thông tin truy cập an toàn (Home Access)
          </h2>
        </div>
        <div className="card p-3">
          <div className="alert alert-info d-flex align-items-start gap-2" role="alert">
            <Lock size={18} className="mt-1" />
            <div>
              <strong>Bảo mật nhiều lớp:</strong> Mã PIN hộp khóa và hướng dẫn vào chung cư được
              <strong> mã hóa AES-256-GCM</strong> ở cấp độ cơ sở dữ liệu. Chỉ nhân viên được phân công
              mới có thể xem, và chỉ trong khoảng <strong>30 phút trước giờ làm</strong> cho đến khi
              họ check-out. Admin và quản trị viên <strong>không thể</strong> nhìn thấy giá trị gốc.
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Phương thức truy cập</label>
              <select
                className="form-select"
                value={accessForm.accessMethod}
                onChange={(e) => setAccessForm({ ...accessForm, accessMethod: e.target.value })}
              >
                <option value="none">Không có (khách tự mở cửa)</option>
                <option value="lockbox">Hộp khóa cơ học (Lockbox)</option>
                <option value="condo_gate">Chung cư - cổng / thang máy</option>
                <option value="both">Cả lockbox + hướng dẫn chung cư</option>
              </select>
            </div>

            {(accessForm.accessMethod === 'lockbox' || accessForm.accessMethod === 'both') && (
              <>
                <div className="col-md-6">
                  <label className="form-label">Vị trí hộp khóa</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Treo ở tay nắm cửa ra vào"
                    value={accessForm.lockboxLocation}
                    onChange={(e) => setAccessForm({ ...accessForm, lockboxLocation: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label d-flex align-items-center gap-2">
                    <KeyRound size={16} /> Mã PIN hộp khóa
                    {accessInfo.hasLockboxPin && (
                      <span className="badge bg-secondary">Đã lưu: {accessInfo.lockboxPinMasked}</span>
                    )}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder={accessInfo.hasLockboxPin ? 'Để trống nếu giữ nguyên PIN cũ' : 'Nhập mã PIN (4-10 ký tự)'}
                    value={accessForm.lockboxPin}
                    onChange={(e) => setAccessForm({ ...accessForm, lockboxPin: e.target.value, keepExistingPin: false })}
                    maxLength={20}
                    autoComplete="off"
                  />
                  {accessInfo.hasLockboxPin && (
                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="clearPin"
                        checked={!accessForm.keepExistingPin && !accessForm.lockboxPin}
                        onChange={(e) => setAccessForm({ ...accessForm, keepExistingPin: !e.target.checked, lockboxPin: '' })}
                      />
                      <label className="form-check-label small text-danger" htmlFor="clearPin">
                        Xóa mã PIN đã lưu
                      </label>
                    </div>
                  )}
                </div>
              </>
            )}

            {(accessForm.accessMethod === 'condo_gate' || accessForm.accessMethod === 'both') && (
              <div className="col-12">
                <label className="form-label d-flex align-items-center gap-2">
                  Hướng dẫn vào chung cư
                  {accessInfo.hasCondoGuide && (
                    <span className="badge bg-secondary">Đã lưu (mã hóa)</span>
                  )}
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder={accessInfo.hasCondoGuide
                    ? 'Để trống nếu giữ nguyên hướng dẫn cũ'
                    : 'Ví dụ: Nói với lễ tân là đi dọn nhà cho chủ 1203. Mã thang máy tầng 12: 4578#'}
                  value={accessForm.condoGuide}
                  onChange={(e) => setAccessForm({ ...accessForm, condoGuide: e.target.value, keepExistingCondo: false })}
                />
              </div>
            )}

            {accessForm.accessMethod !== 'none' && (
              <div className="col-12">
                <label className="form-label d-flex align-items-center gap-2">
                  Ghi chú bảo mật bổ sung
                  {accessInfo.hasAccessNote && (
                    <span className="badge bg-secondary">Đã lưu (mã hóa)</span>
                  )}
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder={accessInfo.hasAccessNote
                    ? 'Để trống nếu giữ nguyên ghi chú cũ'
                    : 'Ví dụ: Chuông cửa không kêu, gõ cửa 3 tiếng. Chó Husky không cắn nhưng sủa to.'}
                  value={accessForm.accessNote}
                  onChange={(e) => setAccessForm({ ...accessForm, accessNote: e.target.value, keepExistingNote: false })}
                />
              </div>
            )}

            <div className="col-12">
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveAccessProfile}
                disabled={savingAccess}
              >
                {savingAccess ? 'Đang mã hóa & lưu...' : 'Lưu thông tin truy cập (mã hóa)'}
              </button>
              <small className="text-muted ms-3">
                Dữ liệu được mã hóa trước khi gửi về server lưu trữ.
              </small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerDashboard;

