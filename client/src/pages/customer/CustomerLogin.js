import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './CustomerLogin.css';

const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      try {
        const response = await customerAPI.login({ email, password });
        if (response.data.success) {
          login(response.data.data, response.data.token, 'customer');
          navigate('/');
        }
      } catch (err) {
        setErrors({
          general: err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-container">
      {/* Decorative elements */}
      <div className="decorative-elements">
        <div className="decoration decoration-1"></div>
        <div className="decoration decoration-2"></div>
        <div className="decoration decoration-3"></div>
      </div>

      <div className="login-card">
        <div className="card-header">
          <div className="brand-container">
            <div className="logo-container">
              <Sparkles className="logo-icon" />
            </div>
            <h1 className="card-title">No Dirt</h1>
          </div>
          <p className="card-description">
            Đăng nhập
          </p>
        </div>

        <div className="card-content">
          <form onSubmit={handleSubmit} className="login-form">
            {errors.general && (
              <div className="error-alert">{errors.general}</div>
            )}

            <div className="form-field">
              <label htmlFor="email" className="field-label">Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="khachhang@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`field-input ${errors.email ? 'input-error' : ''}`}
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
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

            <div className="form-actions">
              <Link
                to="/customer/forgot-password"
                className="forgot-link"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="card-footer">
            <p className="footer-text">
              Chưa có tài khoản?{' '}
              <Link to="/customer/register" className="footer-link">
                Đăng ký ngay
              </Link>
            </p>
            <p className="divider">hoặc</p>
            <p className="footer-text">
              Bạn là công ty?{' '}
              <Link to="/manager/login" className="footer-link">
                Đăng nhập tại đây
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
