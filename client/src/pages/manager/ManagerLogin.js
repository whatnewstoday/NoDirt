import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { managerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserCog, Mail, Lock, Eye, EyeOff, Info } from 'lucide-react';
import './ManagerLogin.css';

const ManagerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Vui lòng nhập email hợp lệ';
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      try {
        // Backend vẫn dùng username, nên chúng ta gửi email như username
        const response = await managerAPI.login({
          username: email, // Backend expects 'username'
          password
        });

        if (response.data.success) {
          login(response.data.data, response.data.token, 'manager');
          navigate('/manager/dashboard');
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
    <div className="manager-login-container">
      {/* Decorative grid pattern */}
      <div className="grid-pattern"></div>

      {/* Decorative elements */}
      <div className="decorative-elements">
        <div className="decoration decoration-1"></div>
        <div className="decoration decoration-2"></div>
        <div className="decoration decoration-3"></div>
      </div>

      <div className="manager-login-card">
        <div className="manager-card-header">
          <div className="manager-logo-container">
            <UserCog className="manager-logo-icon" />
          </div>
          <h1 className="manager-card-title">Quản Lý Điều Hành</h1>
          <p className="manager-card-description">
            Đăng nhập để phân công và giám sát công việc
          </p>
        </div>

        <div className="manager-card-content">
          <div className="manager-alert">
            <Info className="alert-icon" />
            <p className="alert-text">
              Dành cho người quản lý được ủy quyền điều hành
            </p>
          </div>

          <form onSubmit={handleSubmit} className="manager-login-form">
            {errors.general && (
              <div className="error-alert">{errors.general}</div>
            )}

            <div className="form-field">
              <label htmlFor="email" className="field-label">Email quản lý</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="manager@cleanpro.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`field-input ${errors.email ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="error-text">{errors.email}</p>
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
                to="/manager/forgot-password"
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

          <div className="manager-card-footer">
            <p className="footer-text">
              Bạn là nhân viên?{' '}
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

export default ManagerLogin;
