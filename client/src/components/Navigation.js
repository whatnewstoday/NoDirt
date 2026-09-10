import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Settings,
  ChevronDown,
  UserCircle,
  Users,
  Shield,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Navigation.css";

const SystemLoginDropdown = ({ onLoginSelect }) => {
  const handleLogin = (role) => {
    if (onLoginSelect) {
      onLoginSelect(role);
    }
  };

  return (
    <div className="nav-dropdown system-dropdown">
      <button type="button" className="nav-link dropdown-btn system-dropdown-btn">
        <Settings className="icon" />
        Hệ thống
        <ChevronDown className="icon icon-sm" />
      </button>
      <div className="dropdown-content system-dropdown-content">
        <p className="system-dropdown-label">Chọn vai trò đăng nhập</p>
        <div className="dropdown-divider" />

        <button
          type="button"
          className="system-dropdown-item"
          onClick={() => handleLogin("employee")}
        >
          <div className="system-dropdown-icon bg-green">
            <UserCircle className="icon text-green" />
          </div>
          <div className="system-dropdown-copy">
            <span className="title">Nhân viên</span>

          </div>
        </button>

        <button
          type="button"
          className="system-dropdown-item"
          onClick={() => handleLogin("manager")}
        >
          <div className="system-dropdown-icon bg-blue">
            <Users className="icon text-blue" />
          </div>
          <div className="system-dropdown-copy">
            <span className="title">Quản lí</span>

          </div>
        </button>

        <button
          type="button"
          className="system-dropdown-item"
          onClick={() => handleLogin("admin")}
        >
          <div className="system-dropdown-icon bg-purple">
            <Shield className="icon text-purple" />
          </div>
          <div className="system-dropdown-copy">
            <span className="title">Quản trị viên</span>

          </div>
        </button>
      </div>
    </div>
  );
};

const Navigation = () => {
  const { user, userType, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    setIsMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const getActiveClassName = (path, exactQuery = null) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (exactQuery) {
      const matchQuery = currentSearch.includes(exactQuery);
      return (currentPath === path && matchQuery) ? 'nav-link active' : 'nav-link';
    }

    if (path === '/customer/bookings') {
      return (currentPath.startsWith('/customer/bookings') && !currentSearch.includes('tab=completed')) ? 'nav-link active' : 'nav-link';
    }

    if (path === '/customer/services') {
      return currentPath.startsWith('/customer/services') ? 'nav-link active' : 'nav-link';
    }

    if (path.endsWith('/dashboard') || path === '/') {
      return currentPath === path ? 'nav-link active' : 'nav-link';
    }

    return currentPath.startsWith(path) ? 'nav-link active' : 'nav-link';
  };

  const getMobileActiveClassName = (path, exactQuery = null) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (exactQuery) {
      const matchQuery = currentSearch.includes(exactQuery);
      return (currentPath === path && matchQuery) ? 'mobile-nav-link active' : 'mobile-nav-link';
    }

    if (path === '/customer/bookings') {
      return (currentPath.startsWith('/customer/bookings') && !currentSearch.includes('tab=completed')) ? 'mobile-nav-link active' : 'mobile-nav-link';
    }

    if (path === '/customer/services') {
      return currentPath.startsWith('/customer/services') ? 'mobile-nav-link active' : 'mobile-nav-link';
    }

    if (path.endsWith('/dashboard') || path === '/') {
      return currentPath === path ? 'mobile-nav-link active' : 'mobile-nav-link';
    }

    return currentPath.startsWith(path) ? 'mobile-nav-link active' : 'mobile-nav-link';
  };

  const getDropdownClassName = (role) => {
    const currentPath = location.pathname;
    let isActive = false;

    if (role === "customer") {
      isActive = currentPath === "/customer/profile" || currentPath === "/customer/book-service";
    } else if (role === "employee") {
      isActive = currentPath === "/employee/profile";
    } else if (role === "manager") {
      isActive = currentPath === "/manager/profile";
    } else if (role === "admin") {
      isActive = currentPath === "/admin/profile";
    }

    return isActive ? "nav-link dropdown-btn active" : "nav-link dropdown-btn";
  };

  // Guest navigation (not authenticated)
  if (!isAuthenticated) {
    return (
      <nav className="navbar">
        <div className="container">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <div className="logo-icon">🏠</div>
              <span className="logo-text">No Dirt</span>
            </Link>

            {/* Desktop Nav */}
            <div className="nav-menu d-none d-md-flex">
              <button type="button" className="nav-link" onClick={() => scrollToSection('home')}>Trang chủ</button>
              <button type="button" className="nav-link" onClick={() => scrollToSection('services')}>Dịch vụ</button>
              <button type="button" className="nav-link" onClick={() => scrollToSection('about')}>Về chúng tôi</button>
              <button type="button" className="nav-link" onClick={() => scrollToSection('contact')}>Liên hệ</button>
            </div>

            <div className="nav-actions d-none d-md-flex">
              <div className="nav-dropdown">
                <button type="button" className="nav-link dropdown-btn">
                  <UserCircle className="icon" />
                  Tài khoản
                  <ChevronDown className="icon icon-sm" />
                </button>
                <div className="dropdown-content customer-dropdown-content">
                  <Link to="/customer/login" className="customer-dropdown-item">
                    <div className="customer-dropdown-icon login">
                      <LogIn className="icon" />
                    </div>
                    <div className="customer-dropdown-copy">
                      <span className="title">Đăng nhập</span>
                    </div>
                  </Link>
                  <Link to="/customer/register" className="customer-dropdown-item">
                    <div className="customer-dropdown-icon register">
                      <UserPlus className="icon" />
                    </div>
                    <div className="customer-dropdown-copy">
                      <span className="title">Đăng ký</span>
                    </div>
                  </Link>
                </div>
              </div>

              <SystemLoginDropdown onLoginSelect={(role) => navigate(`/${role}/login`)} />
            </div>

            {/* Mobile hamburger */}
            <button className="mobile-menu-btn d-md-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <span className="hamburger-icon">{isMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>

          {/* Mobile Nav */}
          {isMenuOpen && (
            <div className="mobile-nav d-md-none">
              <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('home')}>Trang chủ</button>
              <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('services')}>Dịch vụ</button>
              <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('about')}>Về chúng tôi</button>
              <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('contact')}>Liên hệ</button>
              <div className="mobile-nav-divider" />
              <Link to="/customer/login" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Đăng nhập</Link>
              <Link to="/customer/register" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Đăng ký</Link>
              <div className="mobile-nav-divider" />
              <span className="mobile-nav-label">Hệ thống</span>
              <Link to="/employee/login" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Nhân viên</Link>
              <Link to="/manager/login" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Quản lí</Link>
              <Link to="/admin/login" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Quản trị viên</Link>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Customer navigation
  if (userType === "customer") {
    return (
      <nav className="navbar">
        <div className="container">
          <div className="nav-container">
            <Link to="/customer/dashboard" className="nav-logo">
              <div className="logo-icon">🏠</div>
              <span className="logo-text">No Dirt</span>
            </Link>

            <div className="nav-menu d-none d-md-flex">
              <Link to="/customer/dashboard" className={getActiveClassName('/customer/dashboard')}>Dashboard</Link>
              <Link to="/customer/services" className={getActiveClassName('/customer/services')}>Dịch vụ</Link>
              <Link to="/customer/bookings" className={getActiveClassName('/customer/bookings')}>Đơn hàng</Link>
              <Link to="/customer/recurring-packages" className={getActiveClassName('/customer/recurring-packages')}>Gói định kỳ</Link>
              <Link to="/customer/contracts" className={getActiveClassName('/customer/contracts')}>Hợp đồng</Link>
              <Link to="/customer/bookings?tab=completed" className={getActiveClassName('/customer/bookings', 'tab=completed')}>Đánh giá</Link>
            </div>

            <div className="nav-actions d-none d-md-flex">
              <div className="nav-dropdown">
                <button type="button" className={getDropdownClassName("customer")}>
                  <UserCircle className="icon" />
                  {user?.name || "Tài khoản"}
                  <ChevronDown className="icon icon-sm" />
                </button>
                <div className="dropdown-content customer-dropdown-content">
                  <div className="customer-dropdown-header" style={{ padding: '0.5rem 0.75rem' }}>
                    <div className="heading">{user?.name || "Tài khoản"}</div>
                    <p className="subheading">{user?.email || ""}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/customer/profile" className="customer-dropdown-item" >
                    <div className="customer-dropdown-icon login">
                      <UserCircle className="icon" />
                    </div>
                    <div className="customer-dropdown-copy">
                      <span className="title">Hồ sơ cá nhân</span>
                    </div>
                  </Link>
                  <Link to="/customer/book-service" className="customer-dropdown-item">
                    <div className="customer-dropdown-icon register">
                      <Settings className="icon" />
                    </div>
                    <div className="customer-dropdown-copy">
                      <span className="title">Đặt dịch vụ mới</span>
                    </div>
                  </Link>
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-logout" onClick={handleLogout}>Đăng xuất</button>
                </div>
              </div>
            </div>

            <button className="mobile-menu-btn d-md-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <span className="hamburger-icon">{isMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>

          {isMenuOpen && (
            <div className="mobile-nav d-md-none">
              <Link to="/customer/dashboard" className={getMobileActiveClassName('/customer/dashboard')} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link to="/customer/services" className={getMobileActiveClassName('/customer/services')} onClick={() => setIsMenuOpen(false)}>Dịch vụ</Link>
              <Link to="/customer/bookings" className={getMobileActiveClassName('/customer/bookings')} onClick={() => setIsMenuOpen(false)}>Đơn hàng</Link>
              <Link to="/customer/recurring-packages" className={getMobileActiveClassName('/customer/recurring-packages')} onClick={() => setIsMenuOpen(false)}>Gói định kỳ</Link>
              <Link to="/customer/contracts" className={getMobileActiveClassName('/customer/contracts')} onClick={() => setIsMenuOpen(false)}>Hợp đồng</Link>
              <Link to="/customer/bookings?tab=completed" className={getMobileActiveClassName('/customer/bookings', 'tab=completed')} onClick={() => setIsMenuOpen(false)}>Đánh giá</Link>
              <div className="mobile-nav-divider" />
              <span className="mobile-nav-label">Tài khoản</span>
              <Link to="/customer/profile" className={getMobileActiveClassName('/customer/profile')} onClick={() => setIsMenuOpen(false)}>Hồ sơ cá nhân</Link>
              <Link to="/customer/book-service" className={getMobileActiveClassName('/customer/book-service')} onClick={() => setIsMenuOpen(false)}>Đặt dịch vụ mới</Link>
              <div className="mobile-nav-divider" />
              <button type="button" className="mobile-nav-link logout-link" onClick={handleLogout}>Đăng xuất</button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Employee navigation
  if (userType === "employee") {
    return (
      <nav className="navbar">
        <div className="container">
          <div className="nav-container">
            <Link to="/employee/dashboard" className="nav-logo">
              <div className="logo-icon">🏠</div>
              <span className="logo-text">No Dirt</span>
            </Link>

            <div className="nav-menu d-none d-md-flex">
              <Link to="/employee/dashboard" className={getActiveClassName('/employee/dashboard')}>Dashboard</Link>
              <Link to="/employee/jobs" className={getActiveClassName('/employee/jobs')}>Công việc</Link>
            </div>

            <div className="nav-actions d-none d-md-flex">
              <div className="nav-dropdown">
                <button type="button" className={getDropdownClassName("employee")}>
                  <UserCircle className="icon" />
                  {user?.name || "Tài khoản"}
                  <ChevronDown className="icon icon-sm" />
                </button>
                <div className="dropdown-content customer-dropdown-content">
                  <div className="customer-dropdown-header" style={{ padding: '0.5rem 0.75rem' }}>
                    <div className="heading">{user?.name || "Tài khoản"}</div>
                    <p className="subheading">{user?.email || ""}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/employee/profile" className="customer-dropdown-item">
                    <div className="customer-dropdown-icon login">
                      <UserCircle className="icon" />
                    </div>
                    <div className="customer-dropdown-copy">
                      <span className="title">Hồ sơ cá nhân</span>
                    </div>
                  </Link>
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-logout" onClick={handleLogout}>Đăng xuất</button>
                </div>
              </div>
            </div>

            <button className="mobile-menu-btn d-md-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <span className="hamburger-icon">{isMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>

          {isMenuOpen && (
            <div className="mobile-nav d-md-none">
              <Link to="/employee/dashboard" className={getMobileActiveClassName('/employee/dashboard')} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link to="/employee/jobs" className={getMobileActiveClassName('/employee/jobs')} onClick={() => setIsMenuOpen(false)}>Công việc</Link>
              <div className="mobile-nav-divider" />
              <span className="mobile-nav-label">Tài khoản</span>
              <Link to="/employee/profile" className={getMobileActiveClassName('/employee/profile')} onClick={() => setIsMenuOpen(false)}>Hồ sơ cá nhân</Link>
              <div className="mobile-nav-divider" />
              <button type="button" className="mobile-nav-link logout-link" onClick={handleLogout}>Đăng xuất</button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Manager navigation
  if (userType === "manager") {
    return (
      <nav className="navbar">
        <div className="container">
          <div className="nav-container">
            <Link to="/manager/dashboard" className="nav-logo">
              <div className="logo-icon">🏠</div>
              <span className="logo-text">No Dirt</span>
            </Link>

            <div className="nav-menu d-none d-md-flex">
              <Link to="/manager/dashboard" className={getActiveClassName('/manager/dashboard')}>Dashboard</Link>
              <Link to="/manager/booking-assignment" className={getActiveClassName('/manager/booking-assignment')}>Phân công</Link>
              <Link to="/manager/bookings" className={getActiveClassName('/manager/bookings')}>Đơn hàng</Link>
              <Link to="/manager/employees" className={getActiveClassName('/manager/employees')}>Nhân viên</Link>
              <Link to="/manager/employee-requests" className={getActiveClassName('/manager/employee-requests')}>Yêu cầu NV</Link>
            </div>

            <div className="nav-actions d-none d-md-flex">
              <div className="nav-dropdown">
                <button type="button" className={getDropdownClassName("manager")}>
                  <UserCircle className="icon" />
                  {user?.name || "Tài khoản"}
                  <ChevronDown className="icon icon-sm" />
                </button>
                <div className="dropdown-content customer-dropdown-content">
                  <div className="customer-dropdown-header" style={{ padding: '0.5rem 0.75rem' }}>
                    <div className="heading">{user?.name || "Tài khoản"}</div>
                    <p className="subheading">{user?.email || ""}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/manager/profile" className="customer-dropdown-item">
                    <div className="customer-dropdown-icon login">
                      <UserCircle className="icon" />
                    </div>
                    <div className="customer-dropdown-copy">
                      <span className="title">Hồ sơ cá nhân</span>
                    </div>
                  </Link>
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-logout" onClick={handleLogout}>Đăng xuất</button>
                </div>
              </div>
            </div>

            <button className="mobile-menu-btn d-md-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <span className="hamburger-icon">{isMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>

          {isMenuOpen && (
            <div className="mobile-nav d-md-none">
              <Link to="/manager/dashboard" className={getMobileActiveClassName('/manager/dashboard')} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link to="/manager/booking-assignment" className={getMobileActiveClassName('/manager/booking-assignment')} onClick={() => setIsMenuOpen(false)}>Phân công</Link>
              <Link to="/manager/bookings" className={getMobileActiveClassName('/manager/bookings')} onClick={() => setIsMenuOpen(false)}>Đơn hàng</Link>
              <Link to="/manager/employees" className={getMobileActiveClassName('/manager/employees')} onClick={() => setIsMenuOpen(false)}>Nhân viên</Link>
              <Link to="/manager/employee-requests" className={getMobileActiveClassName('/manager/employee-requests')} onClick={() => setIsMenuOpen(false)}>Yêu cầu NV</Link>
              <div className="mobile-nav-divider" />
              <span className="mobile-nav-label">Tài khoản</span>
              <Link to="/manager/profile" className={getMobileActiveClassName('/manager/profile')} onClick={() => setIsMenuOpen(false)}>Hồ sơ cá nhân</Link>
              <div className="mobile-nav-divider" />
              <button type="button" className="mobile-nav-link logout-link" onClick={handleLogout}>Đăng xuất</button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Admin navigation
  if (userType === "admin") {
    return (
      <nav className="navbar">
        <div className="container">
          <div className="nav-container">
            <Link to="/admin/dashboard" className="nav-logo">
              <div className="logo-icon">🏠</div>
              <span className="logo-text">No Dirt</span>
            </Link>

            <div className="nav-menu admin-menu d-none d-md-flex">
              <Link to="/admin/dashboard" className={getActiveClassName('/admin/dashboard')}>Dashboard</Link>
              <Link to="/admin/services" className={getActiveClassName('/admin/services')}>Dịch vụ</Link>
              <Link to="/admin/employees" className={getActiveClassName('/admin/employees')}>Nhân viên</Link>
              <Link to="/admin/bookings" className={getActiveClassName('/admin/bookings')}>Đơn hàng</Link>
              <Link to="/admin/employee-requests" className={getActiveClassName('/admin/employee-requests')}>Yêu cầu NV</Link>
              <Link to="/admin/system-users" className={getActiveClassName('/admin/system-users')}>Người dùng</Link>
            </div>

            <div className="nav-actions d-none d-md-flex">
              <div className="nav-dropdown">
                <button type="button" className={getDropdownClassName("admin")}>
                  <UserCircle className="icon" />
                  {user?.name || "Tài khoản"}
                  <ChevronDown className="icon icon-sm" />
                </button>
                <div className="dropdown-content customer-dropdown-content">
                  <div className="customer-dropdown-header" style={{ padding: '0.5rem 0.75rem' }}>
                    <div className="heading">{user?.name || "Tài khoản"}</div>
                    <p className="subheading">{user?.email || ""}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/admin/profile" className="customer-dropdown-item">
                    <div className="customer-dropdown-icon login">
                      <UserCircle className="icon" />
                    </div>
                    <div className="customer-dropdown-copy">
                      <span className="title">Hồ sơ cá nhân</span>
                    </div>
                  </Link>
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-logout" onClick={handleLogout}>Đăng xuất</button>
                </div>
              </div>
            </div>

            <button className="mobile-menu-btn d-md-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <span className="hamburger-icon">{isMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>

          {isMenuOpen && (
            <div className="mobile-nav d-md-none">
              <Link to="/admin/dashboard" className={getMobileActiveClassName('/admin/dashboard')} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link to="/admin/services" className={getMobileActiveClassName('/admin/services')} onClick={() => setIsMenuOpen(false)}>Dịch vụ</Link>
              <Link to="/admin/employees" className={getMobileActiveClassName('/admin/employees')} onClick={() => setIsMenuOpen(false)}>Nhân viên</Link>
              <Link to="/admin/bookings" className={getMobileActiveClassName('/admin/bookings')} onClick={() => setIsMenuOpen(false)}>Đơn hàng</Link>
              <Link to="/admin/employee-requests" className={getMobileActiveClassName('/admin/employee-requests')} onClick={() => setIsMenuOpen(false)}>Yêu cầu NV</Link>
              <Link to="/admin/system-users" className={getMobileActiveClassName('/admin/system-users')} onClick={() => setIsMenuOpen(false)}>Người dùng</Link>
              <div className="mobile-nav-divider" />
              <span className="mobile-nav-label">Tài khoản</span>
              <Link to="/admin/profile" className={getMobileActiveClassName('/admin/profile')} onClick={() => setIsMenuOpen(false)}>Hồ sơ cá nhân</Link>
              <div className="mobile-nav-divider" />
              <button type="button" className="mobile-nav-link logout-link" onClick={handleLogout}>Đăng xuất</button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  return null;
};

export default Navigation;
