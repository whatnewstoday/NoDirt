import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import '../AuthPages.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await customerAPI.forgotPassword({ email });
      if (response.data.success) {
        setMessage(response.data.message);
        setEmail('');
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Quên Mật Khẩu</h2>
        <p className="auth-subtitle">
          Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
        </p>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nguyenvana@example.com"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Gửi Email'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/customer/login">Quay lại đăng nhập</Link>
          <span className="separator">•</span>
          <Link to="/customer/register">Đăng ký tài khoản mới</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

