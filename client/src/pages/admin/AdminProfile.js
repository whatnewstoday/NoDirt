import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import './Admin.css';

const AdminProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState({
    username: '',
    name: '',
    email: '',
  });

  // Change password states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getProfile();
      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  // Password change handlers
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    setPasswordError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await adminAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setPasswordSuccess('Đổi mật khẩu thành công!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Hồ sơ Admin</h1>
          <p>Thông tin tài khoản quản trị viên</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="row justify-content-center">
          <div className="col-md-8">
            {/* Profile Info Card */}
            <div className="card">
              <div className="card-header">
                <h3>Thông tin tài khoản</h3>
              </div>
              <div className="card-body">
                <div className="form-group mb-3">
                  <label>Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.username || ''}
                    disabled
                  />
                  <small className="text-muted">Username không thể thay đổi</small>
                </div>

                <div className="form-group mb-3">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.name || ''}
                    disabled
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profile.email || ''}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="card mt-4">
              <div className="card-header">
                <h3>Bảo mật</h3>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5>Mật khẩu</h5>
                    <p className="text-muted mb-0">••••••••</p>
                  </div>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Đổi mật khẩu</h4>
              <button className="close-btn" onClick={handleClosePasswordModal}>&times;</button>
            </div>
            <div className="modal-body">
              {passwordError && <div className="alert alert-danger">{passwordError}</div>}
              {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="form-control"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="newPassword">Mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    minLength="6"
                    required
                  />
                  <small className="text-muted">Tối thiểu 6 ký tự</small>
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleClosePasswordModal}
                    disabled={passwordLoading}
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;

