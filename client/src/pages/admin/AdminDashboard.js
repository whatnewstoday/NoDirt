import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Users,
  Package,
  AlertTriangle,
  BellRing,
  UserPlus,
  ClipboardList,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalServices: 0,
    totalEmployees: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRequests: 0,
    pendingRequests: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      if (response.data.success) {
        const data = response.data.data;
        setStats(data.stats || {});
        setRecentBookings(data.recentBookings || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);



  const statCards = [
    {
      title: 'Dịch vụ',
      value: stats.totalServices || 0,
      icon: Layers,
      accent: 'stat-blue',
      to: '/admin/services'
    },
    {
      title: 'Nhân viên',
      value: stats.totalEmployees || 0,
      icon: Users,
      accent: 'stat-purple',
      to: '/admin/employees'
    },
    {
      title: 'Đơn hàng',
      value: stats.totalBookings || 0,
      icon: Package,
      accent: 'stat-green',
      to: '/admin/bookings'
    }
  ];

  const quickActions = [
    {
      title: 'Quản lý dịch vụ',
      description: 'Tạo & cập nhật bảng giá',
      icon: Layers,
      to: '/admin/services',
      accent: 'action-blue'
    },
    {
      title: 'Quản lý nhân viên',
      description: 'Phân quyền & tạo tài khoản',
      icon: Users,
      to: '/admin/employees',
      accent: 'action-purple'
    },
    {
      title: 'Đơn hàng hệ thống',
      description: 'Theo dõi toàn bộ booking',
      icon: ClipboardList,
      to: '/admin/bookings',
      accent: 'action-green'
    },
    {
      title: 'Yêu cầu nhân sự',
      description: 'Duyệt đề xuất bổ sung nhân viên',
      icon: UserPlus,
      to: '/admin/employee-requests',
      accent: 'action-orange'
    }
  ];

  const pendingHighlights = [
    {
      title: 'Đơn hàng chờ',
      value: stats.pendingBookings || 0,
      description: 'Đơn chưa xác nhận',
      icon: AlertTriangle,
      accent: 'pending-orange',
      to: '/admin/bookings'
    },
    {
      title: 'Yêu cầu nhân viên',
      value: stats.pendingRequests || 0,
      description: 'Cần xử lý ngay',
      icon: UserPlus,
      accent: 'pending-purple',
      to: '/admin/employee-requests'
    }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'order-status-upcoming',
      confirmed: 'order-status-progress',
      in_progress: 'order-status-progress',
      completed: 'order-status-completed',
      cancelled: 'order-status-cancelled'
    };
    return badges[status] || 'order-status-default';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  return (
    <div className="admin-dashboard admin-dashboard-modern">
      <div className="admin-dashboard-shell">
        <section className="welcome-section admin">
          <div className="welcome-overlay"></div>
          <div className="welcome-content">
            <div className="welcome-text">
              <p className="welcome-subtitle">{greetingText},</p>
              <h1 className="welcome-title">Admin {user?.username || 'No Dirt'} </h1>
              <p className="welcome-description">
                Trung tâm điều hành hệ thống. Mọi dữ liệu dịch vụ, nhân viên và booking đều hiển thị tại đây.
              </p>
              <div className="welcome-stats">
                <div className="welcome-stat-card">
                  <span className="label">Pending cần xử lý</span>
                  <span className="value">
                    {(stats.pendingBookings || 0) +
                      (stats.pendingRequests || 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="welcome-illustration">
              <img
                src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80"
                alt="Admin overview"
              />
              <div className="welcome-illustration-blur"></div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        ) : (
          <>
            <section className="stats-section">
              <div className="section-heading">
                <h2>Tổng quan hệ thống</h2>
              </div>
              <div className="stats-grid">
                {statCards.map(({ title, value, icon: IconComponent, accent, to }) => (
                  <Link key={title} to={to} className="stat-card-link">
                    <div className={`stat-card-modern ${accent}`}>
                      <div className="stat-icon-modern">
                        <IconComponent size={22} />
                      </div>
                      <div>
                        <p className="stat-label">{title}</p>
                        <p className="stat-value">{value}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="pending-highlight-grid">
              {pendingHighlights.map(({ title, value, description, icon: IconComponent, accent, to }) => (
                <Link key={title} to={to} className={`pending-highlight-card ${accent}`}>
                  <div className="highlight-icon">
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <p className="highlight-label">{title}</p>
                    <p className="highlight-value">{value}</p>
                    <span className="highlight-description">{description}</span>
                  </div>
                </Link>
              ))}
            </section>

            <section className="quick-actions-modern">
              <div className="section-heading">
                <h2>Quản lý nhanh</h2>
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

            <section className="recent-orders-section admin">
              <div className="section-header">
                <h2>Đơn hàng gần đây</h2>
                <Link to="/admin/bookings" className="btn btn-outline-primary btn-sm">
                  Xem tất cả
                </Link>
              </div>

              {recentBookings.length > 0 ? (
                <div className="table-responsive modern">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Dịch vụ</th>
                        <th>Ngày</th>
                        <th>Trạng thái</th>
                        <th>Nhân viên</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td><strong>#{booking.id}</strong></td>
                          <td>{booking.customerName}</td>
                          <td>{booking.serviceName}</td>
                          <td>{new Date(booking.bookingDate).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`order-status-badge ${getStatusBadge(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </td>
                          <td>{booking.employeeName || <em>Chưa gán</em>}</td>
                          <td>
                            <Link
                              to={`/admin/bookings/${booking.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Chi tiết
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state modern">
                  <div className="empty-icon">📭</div>
                  <h4>Chưa có đơn hàng nào</h4>
                  <p>Các thông tin mới sẽ hiển thị tại đây.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

