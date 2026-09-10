import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './AdminLogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!username) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    } else if (username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await adminAPI.login({ username, password });
        if (response.data.success) {
          login(response.data.data, response.data.token, 'admin');
          navigate('/admin/dashboard');
        }
      } catch (err) {
        setErrors({
          general: err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="admin-login-container">
      {/* Decorative grid pattern */}
      <div className="grid-pattern"></div>

      {/* Decorative elements */}
      <div className="decorative-elements">
        <div className="decoration decoration-1"></div>
        <div className="decoration decoration-2"></div>
        <div className="decoration decoration-3"></div>
      </div>

      <div className="admin-login-card">
        <div className="admin-card-header">
          <div className="admin-logo-container">
            <Shield className="admin-logo-icon" />
          </div>
          <h1 className="admin-card-title">Quản Trị Viên</h1>
          <p className="admin-card-description">
            Đăng nhập vào hệ thống quản lý No Dirt
          </p>
        </div>

        <div className="admin-card-content">
          <div className="admin-alert">
            <AlertCircle className="alert-icon" />
            <p className="alert-text">
              Chỉ dành cho quản trị viên được ủy quyền
            </p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            {errors.general && (
              <div className="error-alert">{errors.general}</div>
            )}

            <div className="form-field">
              <label htmlFor="username" className="field-label">Tên đăng nhập</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                  className={`field-input ${errors.username ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.username && (
                <p className="error-text">{errors.username}</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="password" className="field-label">Mật khẩu</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={`field-input ${errors.password ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="eye-icon" />
                  ) : (
                    <Eye className="eye-icon" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <Link
                to="/admin/forgot-password"
                className="footer-link"
                style={{ fontSize: '0.875rem' }}
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-text">
                  <span className="spinner"></span>
                  Đang xử lý...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="admin-card-footer">
            <p className="footer-text">
              Nhân viên hoặc khách hàng?{' '}
              <Link to="/employee/login" className="footer-link">
                Đăng nhập tại đây
              </Link>
            </p>
            <p className="footer-text" style={{ marginTop: '0.5rem' }}>
              <Link to="/" className="footer-link">
                ← Quay lại trang chủ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
