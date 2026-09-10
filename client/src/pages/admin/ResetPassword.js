import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Shield, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import './AdminLogin.css';

const AdminResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Token không hợp lệ');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);

        try {
            const response = await adminAPI.resetPassword({
                token,
                newPassword: formData.password
            });

            if (response.data.success) {
                setMessage(response.data.message);
                setTimeout(() => {
                    navigate('/admin/login');
                }, 2000);
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
        <div className="admin-login-container">
            <div className="grid-pattern"></div>
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
                    <h1 className="admin-card-title">Đặt Lại Mật Khẩu</h1>
                    <p className="admin-card-description">
                        Nhập mật khẩu mới cho tài khoản quản trị của bạn
                    </p>
                </div>

                <div className="admin-card-content">
                    {message && (
                        <div className="admin-alert" style={{ backgroundColor: '#d1fae5', borderColor: '#a7f3d0' }}>
                            <CheckCircle className="alert-icon" style={{ color: '#059669' }} />
                            <p className="alert-text" style={{ color: '#065f46' }}>{message}</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-alert">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="admin-login-form">
                        <div className="form-field">
                            <label htmlFor="password" className="field-label">Mật khẩu mới</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Nhập mật khẩu mới"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="field-input"
                                    required
                                    disabled={loading || !token}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="toggle-password"
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
                                </button>
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="confirmPassword" className="field-label">Xác nhận mật khẩu</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="field-input"
                                    required
                                    disabled={loading || !token}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="toggle-password"
                                    disabled={loading}
                                >
                                    {showConfirmPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading || !token}
                        >
                            {loading ? (
                                <span className="loading-text">
                                    <span className="spinner"></span>
                                    Đang xử lý...
                                </span>
                            ) : (
                                'Đặt Lại Mật Khẩu'
                            )}
                        </button>
                    </form>

                    <div className="admin-card-footer">
                        <p className="footer-text">
                            <Link to="/admin/login" className="footer-link">
                                Quay lại đăng nhập
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminResetPassword;
