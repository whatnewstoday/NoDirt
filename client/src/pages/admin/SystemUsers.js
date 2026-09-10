import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import './Admin.css';

const SystemUsers = () => {
    const [activeTab, setActiveTab] = useState('manager');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Manager form
    const [managerForm, setManagerForm] = useState({
        username: '',
        password: '',
        name: '',
        email: '',
        phoneNumber: ''
    });

    // Admin form
    const [adminForm, setAdminForm] = useState({
        username: '',
        password: '',
        name: '',
        email: ''
    });

    const handleManagerChange = (e) => {
        setManagerForm({ ...managerForm, [e.target.name]: e.target.value });
    };

    const handleAdminChange = (e) => {
        setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
    };

    const handleCreateManager = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await adminAPI.createManager(managerForm);
            if (response.data.success) {
                setSuccess('Tạo manager mới thành công!');
                setManagerForm({
                    username: '',
                    password: '',
                    name: '',
                    email: '',
                    phoneNumber: ''
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tạo manager');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await adminAPI.createAdmin(adminForm);
            if (response.data.success) {
                setSuccess('Tạo admin mới thành công!');
                setAdminForm({
                    username: '',
                    password: '',
                    name: '',
                    email: ''
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tạo admin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="container">
                <div className="page-header">
                    <h1>Quản lý tài khoản hệ thống</h1>
                    <p>Tạo tài khoản Manager và Admin mới</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="card">
                    <div className="card-header">
                        <div className="system-user-tabs">
                            <button
                                className={`system-user-tab ${activeTab === 'manager' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('manager'); setError(''); setSuccess(''); }}
                            >

                                <span className="tab-text">
                                    <strong>Tạo Manager</strong>
                                    <small>Quản lý nhân viên & booking</small>
                                </span>
                            </button>
                            <button
                                className={`system-user-tab ${activeTab === 'admin' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('admin'); setError(''); setSuccess(''); }}
                            >
                                <span className="tab-text">
                                    <strong>Tạo Admin</strong>
                                    <small>Toàn quyền hệ thống</small>
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="card-body">
                        {/* Manager Form */}
                        {activeTab === 'manager' && (
                            <form onSubmit={handleCreateManager}>
                                <h3>Tạo tài khoản Manager mới</h3>
                                <p className="text-muted mb-4">Manager có thể quản lý booking và phân công nhân viên</p>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Username *</label>
                                            <input
                                                type="text"
                                                name="username"
                                                className="form-control"
                                                value={managerForm.username}
                                                onChange={handleManagerChange}
                                                required
                                                placeholder="Tên đăng nhập"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Mật khẩu *</label>
                                            <input
                                                type="password"
                                                name="password"
                                                className="form-control"
                                                value={managerForm.password}
                                                onChange={handleManagerChange}
                                                required
                                                placeholder="Mật khẩu"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Họ tên *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                value={managerForm.name}
                                                onChange={handleManagerChange}
                                                required
                                                placeholder="Họ và tên"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Email *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                value={managerForm.email}
                                                onChange={handleManagerChange}
                                                required
                                                placeholder="Email"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Số điện thoại</label>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                className="form-control"
                                                value={managerForm.phoneNumber}
                                                onChange={handleManagerChange}
                                                placeholder="Số điện thoại"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Đang tạo...' : 'Tạo Manager'}
                                </button>
                            </form>
                        )}

                        {/* Admin Form */}
                        {activeTab === 'admin' && (
                            <form onSubmit={handleCreateAdmin}>
                                <h3>Tạo tài khoản Admin mới</h3>
                                <p className="text-muted mb-4">Admin có toàn quyền quản lý hệ thống</p>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Username *</label>
                                            <input
                                                type="text"
                                                name="username"
                                                className="form-control"
                                                value={adminForm.username}
                                                onChange={handleAdminChange}
                                                required
                                                placeholder="Tên đăng nhập"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Mật khẩu *</label>
                                            <input
                                                type="password"
                                                name="password"
                                                className="form-control"
                                                value={adminForm.password}
                                                onChange={handleAdminChange}
                                                required
                                                placeholder="Mật khẩu"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Họ tên *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                value={adminForm.name}
                                                onChange={handleAdminChange}
                                                required
                                                placeholder="Họ và tên"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                value={adminForm.email}
                                                onChange={handleAdminChange}
                                                placeholder="Email (không bắt buộc)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Đang tạo...' : 'Tạo Admin'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemUsers;
