import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import './Admin.css';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    basicPrice: '',
    duration: ''
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await adminAPI.getAllServices();
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dịch vụ:', error);
      setError('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        serviceName: service.serviceName,
        description: service.description,
        basicPrice: service.basicPrice,
        duration: service.duration
      });
    } else {
      setEditingService(null);
      setFormData({
        serviceName: '',
        description: '',
        basicPrice: '',
        duration: ''
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.serviceName.trim() || !formData.basicPrice || !formData.duration) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      if (editingService) {
        await adminAPI.updateService(editingService.id, formData);
        setSuccess('Cập nhật dịch vụ thành công!');
      } else {
        await adminAPI.createService(formData);
        setSuccess('Tạo dịch vụ mới thành công!');
      }
      handleCloseModal();
      loadServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      return;
    }

    try {
      await adminAPI.deleteService(serviceId);
      setSuccess('Xóa dịch vụ thành công!');
      loadServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Không thể xóa dịch vụ. Vui lòng thử lại.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="admin-services">
      <div className="page-header">
        <h1>Quản Lý Dịch Vụ</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Thêm dịch vụ mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : services.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên dịch vụ</th>
                <th>Mô tả</th>
                <th>Đơn giá (VNĐ/m²)</th>
                <th>Thời gian (phút)</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id}>
                  <td><strong>#{service.id}</strong></td>
                  <td>{service.serviceName}</td>
                  <td className="text-truncate" style={{ maxWidth: '300px' }}>
                    {service.description}
                  </td>
                  <td>{service.basicPrice?.toLocaleString()} VNĐ/m²</td>
                  <td>{service.duration} phút</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleOpenModal(service)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(service.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🛠️</div>
          <h4>Chưa có dịch vụ nào</h4>
          <p>Thêm dịch vụ mới để bắt đầu!</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            Thêm dịch vụ mới
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="mb-3">
                  <label className="form-label">
                    Tên dịch vụ <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleChange}
                    placeholder="Ví dụ: Vệ sinh văn phòng"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Mô tả
                  </label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Mô tả chi tiết về dịch vụ..."
                  ></textarea>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Đơn giá (VNĐ/m²) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="basicPrice"
                      value={formData.basicPrice}
                      onChange={handleChange}
                      placeholder="100000"
                      min="0"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Thời gian (phút) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="60"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingService ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;

