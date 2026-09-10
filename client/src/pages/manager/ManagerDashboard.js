import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Activity,
  CheckCircle2,
  Users,
  UserPlus,
  Calendar,
  Clock,
  MapPin,
  UserCheck
} from 'lucide-react';
import { managerAPI } from '../../services/api';
import './Manager.css';

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      pendingBookings: 0,
      activeBookings: 0,
      completedToday: 0,
      totalEmployees: 0,
      availableEmployees: 0,
    },
    recentPending: [],
    recentActive: [],
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (err) {
      console.error('Dashboard Error:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải dashboard');
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

  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);



  const statCards = [
    {
      title: 'Chờ phân công',
      value: dashboardData.stats.pendingBookings,
      icon: ClipboardList,
      accent: 'stat-orange',
      to: '/manager/bookings/pending'
    },
    {
      title: 'Đang thực hiện',
      value: dashboardData.stats.activeBookings,
      icon: Activity,
      accent: 'stat-purple',
      to: '/manager/bookings/active'
    },
    {
      title: 'Hoàn thành hôm nay',
      value: dashboardData.stats.completedToday,
      icon: CheckCircle2,
      accent: 'stat-green'
    },
    {
      title: 'Nhân viên rảnh',
      value: `${dashboardData.stats.availableEmployees}/${dashboardData.stats.totalEmployees}`,
      icon: Users,
      accent: 'stat-blue',
      to: '/manager/employees'
    }
  ];

  const quickActions = [
    {
      title: 'Phân công booking',
      description: 'Xử lý ngay các đơn đang chờ',
      icon: ClipboardList,
      to: '/manager/bookings/pending',
      accent: 'action-blue'
    },
    {
      title: 'Theo dõi tiến độ',
      description: 'Nắm bắt hoạt động nhân viên',
      icon: Activity,
      to: '/manager/bookings/active',
      accent: 'action-purple'
    },
    {
      title: 'Yêu cầu nhân sự',
      description: 'Gửi đề xuất nhân viên mới',
      icon: UserPlus,
      to: '/manager/employee-requests',
      accent: 'action-green'
    }
  ];

  const statusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
      case 'booked':
        return 'order-status-upcoming';
      case 'processing':
      case 'confirmed':
        return 'order-status-progress';
      case 'completed':
        return 'order-status-completed';
      case 'cancelled':
        return 'order-status-cancelled';
      default:
        return 'order-status-default';
    }
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
        <div className="manager-dashboard">
          <section className="welcome-section manager">
            <div className="welcome-overlay"></div>
            <div className="welcome-content">
              <div className="welcome-text">
                <p className="welcome-subtitle">{greetingText},</p>
                <h1 className="welcome-title">Manager! </h1>
                <p className="welcome-description">
                  Toàn bộ dữ liệu hoạt động đang được cập nhật liên tục. Hãy phân công và theo dõi tiến độ ngay.
                </p>
                <div className="welcome-stats">
                  <div className="welcome-stat-card">
                    <span className="label">Nhân viên sẵn sàng</span>
                    <span className="value">
                      {dashboardData.stats.availableEmployees}/{dashboardData.stats.totalEmployees}
                    </span>
                  </div>
                </div>
              </div>
              <div className="welcome-illustration">
                <img
                  src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80"
                  alt="Manager dashboard"
                />
                <div className="welcome-illustration-blur"></div>
              </div>
            </div>
          </section>

          {error && (
            <div className="alert alert-danger modern-alert">
              {error}
              <button onClick={loadDashboard} className="btn btn-sm btn-outline-light ms-3">
                Thử lại
              </button>
            </div>
          )}

          <section className="stats-section">
            <div className="section-heading">
              <h2>Tổng quan vận hành</h2>
            </div>
            <div className="stats-grid">
              {statCards.map(({ title, value, icon: IconComponent, accent, to }) => {
                const cardContent = (
                  <div className={`stat-card-modern ${accent}`}>

                    <div>
                      <p className="stat-label">{title}</p>
                      <p className="stat-value">{value}</p>
                    </div>
                  </div>
                );
                return to ? (
                  <Link key={title} to={to} className="stat-card-link">
                    {cardContent}
                  </Link>
                ) : (
                  <div key={title}>{cardContent}</div>
                );
              })}
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

          <section className="manager-task-section">
            <div className="task-card">
              <div className="section-header">
                <h2>Booking chờ phân công</h2>
                <Link to="/manager/bookings/pending" className="btn btn-outline-primary btn-sm">
                  Xem tất cả
                </Link>
              </div>
              <div className="task-list">
                {dashboardData.recentPending.length === 0 ? (
                  <p className="text-muted">Không có booking chờ phân công</p>
                ) : (
                  dashboardData.recentPending.map((booking) => (
                    <div key={booking.id} className="task-item">
                      <div className="task-main">
                        <div>
                          <h3>{booking.customerName}</h3>
                          <p>{booking.serviceName}</p>
                        </div>
                        <span className={`order-status-badge ${statusBadgeClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="task-meta">
                        <div className="meta-block">
                          <Calendar size={16} />
                          <span>{formatDate(booking.bookingDate)}</span>
                        </div>
                        <div className="meta-block">
                          <Clock size={16} />
                          <span>{formatTime(booking.cleaningTime)}</span>
                        </div>
                        <div className="meta-block">
                          <MapPin size={16} />
                          <span>{booking.customerAddress || 'Chưa có địa chỉ'}</span>
                        </div>
                      </div>
                      <div className="task-actions">
                        <Link to={`/manager/bookings/${booking.id}/assign`} className="btn btn-primary w-100">
                          Phân công ngay
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="task-card">
              <div className="section-header">
                <h2>Booking đang thực hiện</h2>
                <Link to="/manager/bookings/active" className="btn btn-outline-primary btn-sm">
                  Xem tất cả
                </Link>
              </div>
              <div className="task-list">
                {dashboardData.recentActive.length === 0 ? (
                  <p className="text-muted">Không có booking đang thực hiện</p>
                ) : (
                  dashboardData.recentActive.map((booking) => (
                    <div key={booking.id} className="task-item">
                      <div className="task-main">
                        <div>
                          <h3>{booking.customerName}</h3>
                          <p>{booking.serviceName}</p>
                        </div>
                        <span className={`order-status-badge ${statusBadgeClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="task-meta">
                        <div className="meta-block">
                          <Calendar size={16} />
                          <span>{formatDate(booking.bookingDate)}</span>
                        </div>
                        <div className="meta-block">
                          <Clock size={16} />
                          <span>{formatTime(booking.cleaningTime)}</span>
                        </div>
                        <div className="meta-block">
                          <UserCheck size={16} />
                          <span>{booking.employeeName || 'Chưa gán nhân viên'}</span>
                        </div>
                      </div>
                      <div className="task-actions muted">
                        <span className="badge badge-secondary"> {booking.employeeName || 'Đang gán'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

