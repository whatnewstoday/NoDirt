import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { managerAPI } from '../../services/api';
import { UserCog, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import './ManagerLogin.css';

const ManagerForgotPassword = () => {
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
            const response = await managerAPI.forgotPassword({ email });
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
                    <h1 className="manager-card-title">Quên Mật Khẩu</h1>
                    <p className="manager-card-description">
                        Nhập email quản lý và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
                    </p>
                </div>

                <div className="manager-card-content">
                    {message && (
                        <div className="manager-alert" style={{ backgroundColor: '#d1fae5', borderColor: '#a7f3d0' }}>
                            <CheckCircle className="alert-icon" style={{ color: '#059669' }} />
                            <p className="alert-text" style={{ color: '#065f46' }}>{message}</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-alert">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="manager-login-form">
                        <div className="form-field">
                            <label htmlFor="email" className="field-label">Email quản lý</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="manager@cleanpro.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="field-input"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading-text">
                                    <span className="spinner"></span>
                                    Đang xử lý...
                                </span>
                            ) : (
                                'Gửi Email'
                            )}
                        </button>
                    </form>

                    <div className="manager-card-footer">
                        <p className="footer-text">
                            <Link to="/manager/login" className="footer-link">
                                <ArrowLeft style={{ width: '0.875rem', height: '0.875rem', display: 'inline', marginRight: '0.25rem' }} />
                                Quay lại đăng nhập
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerForgotPassword;
