import React, { useEffect, useState } from 'react';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Customer.css';

const Profile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await customerAPI.getProfile();
      if (response.data.success) {
        const profileData = response.data.data;
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phoneNumber: profileData.phoneNumber || '',
          address: profileData.address || ''
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải hồ sơ:', error);
      setError('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await customerAPI.updateProfile(formData);
      if (response.data.success) {
        setSuccess('Cập nhật hồ sơ thành công!');
        setProfile({ ...profile, ...formData });
        setEditing(false);
        
        // Update user in auth context
        const token = localStorage.getItem('token');
        if (token) {
          login({ ...user, ...formData }, token, 'customer');
        }

        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || ''
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
      const response = await customerAPI.changePassword({
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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-3">Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="customer-profile">
      <div className="page-header">
        <h1>Hồ Sơ Cá Nhân</h1>
        <p className="text-muted">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="row">
        <div className="col-lg-8">
          <div className="profile-card">
            <div className="profile-card-header">
              <h3>Thông tin cá nhân</h3>
              {!editing && (
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setEditing(true)}
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label">Họ và tên</label>
                <div className="col-sm-9">
                  {editing ? (
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <p className="form-control-plaintext">{profile?.name || '-'}</p>
                  )}
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-3 col-form-label">Email</label>
                <div className="col-sm-9">
                  {editing ? (
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <p className="form-control-plaintext">{profile?.email || '-'}</p>
                  )}
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-3 col-form-label">Số điện thoại</label>
                <div className="col-sm-9">
                  {editing ? (
                    <input
                      type="tel"
                      className="form-control"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="0987654321"
                    />
                  ) : (
                    <p className="form-control-plaintext">{profile?.phoneNumber || '-'}</p>
                  )}
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-3 col-form-label">Địa chỉ</label>
                <div className="col-sm-9">
                  {editing ? (
                    <textarea
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                      placeholder="123 Nguyễn Trãi, Quận 5, TP.HCM"
                    ></textarea>
                  ) : (
                    <p className="form-control-plaintext">{profile?.address || '-'}</p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Change Password Section */}
          <div className="profile-card mt-4">
            <div className="profile-card-header">
              <h3>Bảo mật</h3>
            </div>
            <div className="security-section">
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

        {/* Stats Sidebar */}
        <div className="col-lg-4">
          <div className="profile-stats-card">
            <div className="profile-avatar">
              <div className="avatar-circle">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h4 className="mt-3">{profile?.name}</h4>
              <p className="text-muted">{profile?.email}</p>
            </div>

            <hr />

            <div className="stats-list">
              <div className="stat-item">
                
                <div>
                  <p className="stat-label">Thành viên từ</p>
                  <p className="stat-value">
                    {profile?.createdAt 
                      ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="help-card mt-4">
            <h4>Cần hỗ trợ?</h4>
            <p>Liên hệ với chúng tôi nếu bạn gặp bất kỳ vấn đề nào.</p>
            <div className="contact-info">
              <p><strong> Hotline:</strong> 1900 1234</p>
              <p><strong> Email:</strong> support@nodirt.vn</p>
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

export default Profile;

