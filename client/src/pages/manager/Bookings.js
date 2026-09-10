import React, { useEffect, useState } from 'react';
import { managerAPI } from '../../services/api';
import './Manager.css';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, bookings]);

    const loadData = async () => {
        try {
            const bookingsRes = await managerAPI.getAllBookings();

            if (bookingsRes.data.success) {
                setBookings(bookingsRes.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            setError('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
        if (activeTab === 'all') {
            setFilteredBookings(bookings);
        } else {
            const filtered = bookings.filter(booking => booking.status === activeTab);
            setFilteredBookings(filtered);
        }
    };

    const handleUpdateStatus = async (bookingId, newStatus) => {
        if (!window.confirm(`Xác nhận cập nhật trạng thái đơn hàng?`)) {
            return;
        }

        try {
            await managerAPI.updateBookingStatus(bookingId, { status: newStatus });
            setSuccess('Cập nhật trạng thái thành công!');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Không thể cập nhật trạng thái. Vui lòng thử lại.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending': 'badge-warning',
            'booked': 'badge-warning',
            'confirmed': 'badge-info',
            'processing': 'badge-primary',
            'in_progress': 'badge-primary',
            'completed': 'badge-success',
            'cancelled': 'badge-danger'
        };
        return badges[status] || 'badge-secondary';
    };

    const getStatusText = (status) => {
        const texts = {
            'pending': 'Chờ xác nhận',
            'booked': 'Đã đặt',
            'confirmed': 'Đã xác nhận',
            'processing': 'Đang xử lý',
            'in_progress': 'Đang thực hiện',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        };
        return texts[status] || status;
    };

    const getPaymentBadge = (status) => {
        return status === 'paid' ? 'badge-success' : 'badge-warning';
    };

    const getPaymentText = (status) => {
        return status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
    };

    const tabs = [
        { key: 'all', label: 'Tất cả', count: bookings.length },
        { key: 'booked', label: 'Đã đặt', count: bookings.filter(b => b.status === 'booked').length },
        { key: 'confirmed', label: 'Đã xác nhận', count: bookings.filter(b => b.status === 'confirmed').length },
        { key: 'processing', label: 'Đang xử lý', count: bookings.filter(b => b.status === 'processing').length },
        { key: 'completed', label: 'Hoàn thành', count: bookings.filter(b => b.status === 'completed').length },
        { key: 'cancelled', label: 'Đã hủy', count: bookings.filter(b => b.status === 'cancelled').length }
    ];

    return (
        <div className="manager-page">
            <div className="container">
                <div className="page-header">
                    <h1>📋 Quản Lý Đơn Hàng</h1>
                    <p>Tất cả đơn hàng trong hệ thống</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Tabs */}
                <div className="request-tabs mb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                            <span className="tab-count">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="loading-spinner">Đang tải...</div>
                    </div>
                ) : filteredBookings.length > 0 ? (
                    <div className="card">
                        <div className="card-body" style={{ overflowX: 'auto' }}>
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Mã đơn</th>
                                        <th>Khách hàng</th>
                                        <th>Dịch vụ</th>
                                        <th>Ngày hẹn</th>
                                        <th>Địa chỉ</th>
                                        <th>Tổng tiền</th>
                                        <th>Thanh toán</th>
                                        <th>Trạng thái</th>
                                        <th>Nhân viên</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map(booking => (
                                        <tr key={booking.id}>
                                            <td><strong>#{booking.id}</strong></td>
                                            <td>{booking.customerName}</td>
                                            <td>{booking.serviceName}</td>
                                            <td>{new Date(booking.bookingDate).toLocaleDateString('vi-VN')}</td>
                                            <td className="text-truncate" style={{ maxWidth: '200px' }}>
                                                {booking.address}
                                            </td>
                                            <td><strong>{booking.totalPrice?.toLocaleString()} VNĐ</strong></td>
                                            <td>
                                                <span className={`badge ${getPaymentBadge(booking.paymentStatus)}`}>
                                                    {getPaymentText(booking.paymentStatus)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(booking.status)}`}>
                                                    {getStatusText(booking.status)}
                                                </span>
                                            </td>
                                            <td>
                                                {booking.employeeName ? (
                                                    <span>{booking.employeeName}</span>
                                                ) : (
                                                    <span className="text-muted">Chưa phân công</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="btn-group-vertical btn-group-sm">
                                                    {(booking.status === 'booked' || booking.status === 'pending') && (
                                                        <button
                                                            className="btn btn-sm btn-outline-success mb-1"
                                                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                                        >
                                                            Xác nhận
                                                        </button>
                                                    )}
                                                    {booking.status === 'confirmed' && (
                                                        <button
                                                            className="btn btn-sm btn-outline-info mb-1"
                                                            onClick={() => handleUpdateStatus(booking.id, 'processing')}
                                                        >
                                                            Bắt đầu
                                                        </button>
                                                    )}
                                                    {booking.status === 'processing' && (
                                                        <button
                                                            className="btn btn-sm btn-outline-success mb-1"
                                                            onClick={() => handleUpdateStatus(booking.id, 'completed')}
                                                        >
                                                            Hoàn thành
                                                        </button>
                                                    )}
                                                    {(booking.status === 'booked' || booking.status === 'pending' || booking.status === 'confirmed') && (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                        >
                                                            Hủy
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <div style={{ fontSize: '3rem' }}>📭</div>
                            <h4 className="mt-3">Không có đơn hàng nào</h4>
                            <p className="text-muted">
                                {activeTab === 'all'
                                    ? 'Chưa có đơn hàng nào trong hệ thống'
                                    : 'Không có đơn hàng nào trong danh mục này'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bookings;
