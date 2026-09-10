import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Calendar, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { customerAPI } from '../../services/api';
import './Customer.css';

const STATUS_MAP = {
  draft: { label: 'Nháp', className: 'status-badge warning', icon: Clock },
  active: { label: 'Đang hiệu lực', className: 'status-badge success', icon: CheckCircle },
  signed: { label: 'Đã ký', className: 'status-badge info', icon: CheckCircle },
  terminated: { label: 'Đã chấm dứt', className: 'status-badge danger', icon: AlertCircle },
};

const FREQ_MAP = {
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
};

const MyContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await customerAPI.getMyContracts();
        if (res.data.success) {
          setContracts(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load contracts:', err);
        setError('Không thể tải danh sách hợp đồng');
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const handleDownload = (downloadUrl, fileName) => {
    const link = document.createElement('a');
    link.href = `http://localhost:3000${downloadUrl}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="customer-contracts">
        <div className="contracts-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải hợp đồng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-contracts">
      <div className="contracts-header">
        <div className="contracts-header-left">
          <Link to="/customer/dashboard" className="back-link">
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </Link>
          <h1>
            <FileText size={28} />
            Hợp đồng dịch vụ
          </h1>
          <p className="contracts-subtitle">Quản lý các hợp đồng dịch vụ định kỳ của bạn</p>
        </div>
      </div>

      {error && (
        <div className="contracts-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {contracts.length === 0 && !error ? (
        <div className="contracts-empty">
          <FileText size={48} strokeWidth={1.5} />
          <h3>Chưa có hợp đồng nào</h3>
          <p>Hợp đồng sẽ được tạo tự động khi bạn chuyển đổi từ buổi dùng thử sang gói định kỳ.</p>
          <Link to="/customer/services" className="btn btn-primary">
            Xem dịch vụ
          </Link>
        </div>
      ) : (
        <div className="contracts-grid">
          {contracts.map((contract) => {
            const statusInfo = STATUS_MAP[contract.status] || STATUS_MAP.draft;
            const StatusIcon = statusInfo.icon;
            return (
              <div className="contract-card" key={contract.id}>
                <div className="contract-card-header">
                  <div className="contract-icon">
                    <FileText size={22} />
                  </div>
                  <div className="contract-meta">
                    <span className="contract-code">{contract.contractCode}</span>
                    <span className={statusInfo.className}>
                      <StatusIcon size={14} />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="contract-card-body">
                  <h3 className="contract-title">
                    {contract.serviceName || 'Dịch vụ định kỳ'}
                  </h3>

                  <div className="contract-details">
                    <div className="contract-detail-row">
                      <Calendar size={15} />
                      <span>Tần suất: <strong>{FREQ_MAP[contract.frequency] || contract.frequency}</strong></span>
                    </div>
                    <div className="contract-detail-row">
                      <Clock size={15} />
                      <span>Ngày tạo: <strong>{formatDate(contract.createdAt)}</strong></span>
                    </div>
                    {contract.signedAt && (
                      <div className="contract-detail-row">
                        <CheckCircle size={15} />
                        <span>Ngày ký: <strong>{formatDate(contract.signedAt)}</strong></span>
                      </div>
                    )}
                  </div>

                  {contract.contractTerms && (
                    <div className="contract-terms-preview">
                      <p>{contract.contractTerms.split('\n').slice(0, 3).join(' • ')}</p>
                    </div>
                  )}
                </div>

                <div className="contract-card-footer">
                  <button
                    className="btn btn-download"
                    onClick={() => handleDownload(contract.downloadUrl, contract.fileName)}
                    title="Tải hợp đồng"
                  >
                    <Download size={16} />
                    Tải hợp đồng
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyContracts;
