import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { managerAPI } from '../../services/api';
import './Manager.css';

const ManagerProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    username: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
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
      const response = await managerAPI.getProfile();
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData({
          name: response.data.data.name,
          email: response.data.data.email,
          phoneNumber: response.data.data.phoneNumber || '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await managerAPI.updateProfile(formData);
      if (response.data.success) {
        setSuccess('Cập nhật thông tin thành công!');
        setProfile({ ...profile, ...formData });
        updateUser({ ...user, name: formData.name });
        setEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật thông tin');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      phoneNumber: profile.phoneNumber || '',
    });
    setEditing(false);
    setError('');
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
      const response = await managerAPI.changePassword({
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
      <div className="manager-page">
        <div className="container">
          <div className="loading-spinner">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-page">
      <div className="container">
        <div className="page-header">
          <h1>Hồ sơ cá nhân</h1>
          <p>Thông tin tài khoản Manager</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h3>Thông tin cá nhân</h3>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn btn-sm btn-primary"
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.username}
                      disabled
                    />
                    <small className="text-muted">Username không thể thay đổi</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="name">Họ và tên</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!editing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!editing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phoneNumber">Số điện thoại</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      className="form-control"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>

                  {editing && (
                    <div className="action-buttons">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="btn btn-secondary"
                      >
                        Hủy
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Lưu thay đổi
                      </button>
                    </div>
                  )}
                </form>
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

export default ManagerProfile;

