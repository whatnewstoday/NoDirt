import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import '../AuthPages.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ. Vui lòng kiểm tra lại link trong email.');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    // Validate password length
    if (formData.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const response = await customerAPI.resetPassword({
        token,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        alert(response.data.message);
        navigate('/customer/login');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Có lỗi xảy ra. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Lỗi</h2>
          <p className="alert alert-error">
            Token không hợp lệ. Vui lòng kiểm tra lại link trong email.
          </p>
          <Link to="/customer/forgot-password" className="btn btn-primary">
            Yêu cầu link mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Đặt Lại Mật Khẩu</h2>
        <p className="auth-subtitle">Nhập mật khẩu mới của bạn</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              placeholder="Tối thiểu 6 ký tự"
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Nhập lại mật khẩu mới"
              disabled={loading}
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/customer/login">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

