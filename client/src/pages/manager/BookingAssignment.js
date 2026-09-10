import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { managerAPI } from '../../services/api';
import './Manager.css';

const BookingAssignment = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'active'
    const [pendingBookings, setPendingBookings] = useState([]);
    const [activeBookings, setActiveBookings] = useState([]);

    useEffect(() => {
        loadAllBookings();
    }, []);

    const loadAllBookings = async () => {
        try {
            setLoading(true);
            const [pendingRes, activeRes] = await Promise.all([
                managerAPI.getPendingBookings(),
                managerAPI.getActiveBookings()
            ]);

            if (pendingRes.data.success) {
                setPendingBookings(pendingRes.data.data);
            }
            if (activeRes.data.success) {
                setActiveBookings(activeRes.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tải danh sách booking');
        } finally {
            setLoading(false);
        }
    };

    const parseDate = (dateString) => {
        if (!dateString) return null;
        const isoCandidate = dateString.replace(' ', 'T');
        const parsed = new Date(isoCandidate);
        if (!isNaN(parsed.getTime())) return parsed;

        const [datePart, timePart] = dateString.split(' ');
        const [year, month, day] = (datePart || '').split(/[-/]/).map(Number);
        if (!year || !month || !day) return null;
        const [hour = 0, minute = 0, second = 0] = (timePart || '').split(':').map(Number);
        return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = parseDate(dateString);
        return date ? date.toLocaleDateString('vi-VN') : new Date(dateString).toLocaleDateString('vi-VN');
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    };

    const formatCurrency = (amount) => {
        const value = Number(amount || 0);
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(value);
    };

    const normalizeStatus = (status = '') =>
        status.toString().toLowerCase().trim().replace(/[\s-]+/g, '_');

    const getStatusBadge = (status) => {
        const key = normalizeStatus(status);
        const statusMap = {
            processing: { class: 'badge-primary', text: 'Đang thực hiện' },
            in_progress: { class: 'badge-primary', text: 'Đang thực hiện' },
            confirmed: { class: 'badge-info', text: 'Đã xác nhận' },
        };
        const statusInfo = statusMap[key] || { class: 'badge-secondary', text: status };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    const currentBookings = activeTab === 'pending' ? pendingBookings : activeBookings;

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
                    <h1>Phân công & Theo dõi</h1>
                    <p>Quản lý booking chờ phân công và đang thực hiện</p>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                        <button onClick={loadAllBookings} className="btn btn-sm btn-outline-danger ms-3">
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Tab Buttons */}
                <div className="request-tabs mb-4">
                    <button
                        className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Chờ phân công
                        <span className="tab-count">{pendingBookings.length}</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Đang thực hiện
                        <span className="tab-count">{activeBookings.length}</span>
                    </button>
                </div>

                {/* Content */}
                {currentBookings.length === 0 ? (
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <div style={{ fontSize: '3rem' }}>📭</div>
                            <h3 className="mt-3">
                                {activeTab === 'pending'
                                    ? 'Không có booking chờ phân công'
                                    : 'Không có booking đang thực hiện'}
                            </h3>
                            <p className="text-muted">
                                {activeTab === 'pending'
                                    ? 'Tất cả booking đã được phân công nhân viên'
                                    : 'Hiện tại không có booking nào đang được thực hiện'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="card">
                        <div className="card-body" style={{ overflowX: 'auto' }}>
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Khách hàng</th>
                                        <th>Dịch vụ</th>
                                        {activeTab === 'active' && <th>Nhân viên</th>}
                                        <th>Ngày & Giờ</th>
                                        {activeTab === 'pending' && <th>Địa chỉ</th>}
                                        {activeTab === 'active' && <th>Trạng thái</th>}
                                        <th>Tổng phí</th>
                                        {activeTab === 'pending' && <th>Thao tác</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentBookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td>#{booking.id}</td>
                                            <td>
                                                <div>
                                                    <strong>{booking.customerName}</strong>
                                                    {activeTab === 'pending' && (
                                                        <>
                                                            <br />
                                                            <small className="text-muted">{booking.customerPhone}</small>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{booking.serviceName}</td>
                                            {activeTab === 'active' && (
                                                <td>
                                                    <div>
                                                        <strong>{booking.employeeName}</strong>
                                                        <br />
                                                        <small className="text-muted">{booking.employeePhone}</small>
                                                    </div>
                                                </td>
                                            )}
                                            <td>
                                                <div>
                                                    <strong>{formatDate(booking.bookingDate)}</strong>
                                                    <br />
                                                    <small className="text-muted">{formatTime(booking.cleaningTime)}</small>
                                                </div>
                                            </td>
                                            {activeTab === 'pending' && (
                                                <td>
                                                    <small>{booking.address}</small>
                                                </td>
                                            )}
                                            {activeTab === 'active' && (
                                                <td>{getStatusBadge(booking.status)}</td>
                                            )}
                                            <td>
                                                <strong className="text-success">
                                                    {formatCurrency(booking.totalPrice)}
                                                </strong>
                                            </td>
                                            {activeTab === 'pending' && (
                                                <td>
                                                    <Link
                                                        to={`/manager/bookings/${booking.id}/assign`}
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        Phân công
                                                    </Link>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingAssignment;
