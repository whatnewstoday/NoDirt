import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  AlarmClock,
  Loader,
  CheckCircle,
  ClipboardCheck,
  User,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import { employeeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Employee.css';

const normalizeStatusKey = (status = '') =>
  status
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');

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

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await employeeAPI.viewAssignedJobs();
      if (response.data.success) {
        const jobsData = response.data.data || [];
        const normalizedJobs = jobsData.map((job) => ({
          ...job,
          statusKey: normalizeStatusKey(job.status),
        }));
        setJobs(normalizedJobs.slice(0, 6));
        const pendingKeys = ['pending', 'confirmed', 'booked', 'processing'];
        setStats({
          total: normalizedJobs.length,
          pending: normalizedJobs.filter((j) => pendingKeys.includes(j.statusKey)).length,
          inProgress: normalizedJobs.filter((j) => j.statusKey === 'in_progress').length,
          completed: normalizedJobs.filter((j) => j.statusKey === 'completed').length
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
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
    { title: 'Tổng công việc', value: stats.total, icon: Briefcase, accent: 'stat-blue' },
    { title: 'Chờ xác nhận', value: stats.pending, icon: AlarmClock, accent: 'stat-orange' },
    { title: 'Đang thực hiện', value: stats.inProgress, icon: Loader, accent: 'stat-purple' },
    { title: 'Hoàn thành', value: stats.completed, icon: CheckCircle, accent: 'stat-green' },
  ];

  const quickActions = [
    {
      title: 'Công việc của tôi',
      description: 'Xem toàn bộ nhiệm vụ được giao',
      icon: ClipboardCheck,
      to: '/employee/jobs',
      accent: 'action-blue'
    },
    {
      title: 'Hồ sơ cá nhân',
      description: 'Cập nhật thông tin và lịch sử',
      icon: User,
      to: '/employee/profile',
      accent: 'action-purple'
    },
    {
      title: 'Lịch làm việc',
      description: 'Tính năng sắp ra mắt',
      icon: Calendar,
      to: '/employee/jobs',
      accent: 'action-green',
      disabled: true
    }
  ];

  const getStatusClass = (statusKey) => {
    switch (statusKey) {
      case 'pending':
      case 'confirmed':
      case 'booked':
      case 'processing':
        return 'order-status-upcoming';
      case 'in_progress':
        return 'order-status-progress';
      case 'completed':
        return 'order-status-completed';
      case 'cancelled':
        return 'order-status-cancelled';
      default:
        return 'order-status-default';
    }
  };

  const getStatusText = (statusKey) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      booked: 'Đã đặt',
      processing: 'Đang xử lý',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[statusKey] || statusKey;
  };

  const recentJobs = jobs.slice(0, 4);

  return (
    <div className="employee-dashboard employee-dashboard-modern">
      <div className="employee-dashboard-shell">
        <section className="welcome-section employee">
          <div className="welcome-overlay"></div>
          <div className="welcome-content">
            <div className="welcome-text">
              <p className="welcome-subtitle">{greetingText},</p>
              <h1 className="welcome-title">{user?.name || 'Nhân viên'} </h1>
              <p className="welcome-description">
                Sẵn sàng cho ngày làm việc hiệu quả. Kiểm tra lịch và cập nhật trạng thái công việc của bạn.
              </p>
              <div className="welcome-stats">
                <div className="welcome-stat-card">
                  <span className="label">Công việc đang chờ</span>
                  <span className="value">{stats.pending + stats.inProgress}</span>
                </div>
              </div>
            </div>
            <div className="welcome-illustration">
              <img
                src="https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=600&q=80"
                alt="Employee dashboard"
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
                <h2>Tổng quan công việc</h2>
              </div>
              <div className="stats-grid">
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

            <section className="quick-actions-modern">
              <div className="section-heading">
                <h2>Thao tác nhanh</h2>
              </div>
              <div className="quick-actions-grid">
                {quickActions.map(({ title, description, icon: IconComponent, to, accent, disabled }) => {
                  const content = (
                    <div className={`action-card-modern ${accent} ${disabled ? 'disabled' : ''}`}>
                      <div className="action-icon-modern">
                        <IconComponent size={26} />
                      </div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  );
                  return disabled ? (
                    <div key={title}>{content}</div>
                  ) : (
                    <Link key={title} to={to}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="recent-orders-section employee">
              <div className="section-header">
                <h2>Công việc gần đây</h2>
                <Link to="/employee/jobs" className="btn btn-outline-primary btn-sm">
                  Xem tất cả
                </Link>
              </div>

              {recentJobs.length > 0 ? (
                <div className="recent-orders-grid">
                  {recentJobs.map((job) => {
                    const statusKey = job.statusKey || normalizeStatusKey(job.status);
                    return (
                      <div key={job.id} className="order-card">
                        <div className="order-card-header">
                          <div>
                            <h3>{job.serviceName}</h3>
                            <p className="order-id">#{job.id}</p>
                          </div>
                          <span className={`order-status-badge ${getStatusClass(statusKey)}`}>
                            {getStatusText(statusKey)}
                          </span>
                        </div>

                        <div className="order-info">
                          <div className="order-info-row">
                            <Calendar size={16} />
                            <span>
                              {parseBookingDate(job.bookingDate || job.bookingDay)?.toLocaleDateString('vi-VN') || '—'}
                            </span>
                          </div>
                          <div className="order-info-row">
                            <Clock size={16} />
                            <span>{job.cleaningTime}</span>
                          </div>
                          <div className="order-info-row">
                            <MapPin size={16} />
                            <span>{job.address}</span>
                          </div>
                        </div>

                        <div className="order-card-footer">
                          <Link
                            to="/employee/jobs"
                            className="btn btn-outline-primary w-100"
                            state={{ highlightJobId: job.id }}
                          >
                            Cập nhật trạng thái
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state modern">
                  <div className="empty-icon">📭</div>
                  <h4>Chưa có công việc nào</h4>
                  <p>Công việc được phân công sẽ xuất hiện tại đây.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;

