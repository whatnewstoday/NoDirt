import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import './Admin.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    responsibleArea: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const employeesRes = await adminAPI.getAllEmployees();

      if (employeesRes.data.success) {
        setEmployees(employeesRes.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      setError('Không thể tải dữ liệu');
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

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        password: '',
        phoneNumber: employee.phoneNumber || '',
        responsibleArea: employee.responsibleArea || ''
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phoneNumber: '',
        responsibleArea: ''
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (!editingEmployee && !formData.password) {
      setError('Vui lòng nhập mật khẩu cho nhân viên mới');
      return;
    }

    try {
      const submitData = { ...formData };
      if (editingEmployee && !submitData.password) {
        delete submitData.password; // Don't update password if empty
      }

      if (editingEmployee) {
        await adminAPI.updateEmployee(editingEmployee.id, submitData);
        setSuccess('Cập nhật nhân viên thành công!');
      } else {
        await adminAPI.createEmployee(submitData);
        setSuccess('Tạo nhân viên mới thành công!');
      }
      handleCloseModal();
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      return;
    }

    try {
      await adminAPI.deleteEmployee(employeeId);
      setSuccess('Xóa nhân viên thành công!');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Không thể xóa nhân viên. Vui lòng thử lại.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="admin-employees">
      <div className="page-header">
        <h1>Quản Lý Nhân Viên</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Thêm nhân viên mới
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
      ) : employees.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên nhân viên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Khu vực</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => (
                <tr key={employee.id}>
                  <td><strong>#{employee.id}</strong></td>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.phoneNumber || '-'}</td>
                  <td>{employee.responsibleArea || '-'}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleOpenModal(employee)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(employee.id)}
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
          <div className="empty-icon">👥</div>
          <h4>Chưa có nhân viên nào</h4>
          <p>Thêm nhân viên mới để bắt đầu!</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            Thêm nhân viên mới
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="mb-3">
                  <label className="form-label">
                    Tên nhân viên <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="employee@example.com"
                    required
                    disabled={editingEmployee}
                  />
                  {editingEmployee && (
                    <small className="text-muted">Email không thể thay đổi</small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Mật khẩu {!editingEmployee && <span className="text-danger">*</span>}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={editingEmployee ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
                    required={!editingEmployee}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="0987654321"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Khu vực phụ trách</label>
                  <input
                    type="text"
                    className="form-control"
                    name="responsibleArea"
                    value={formData.responsibleArea}
                    onChange={handleChange}
                    placeholder="Quận 1, TP.HCM"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

