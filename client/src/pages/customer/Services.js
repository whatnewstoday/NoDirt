import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Sparkles,
  Sofa,
  Package,
  Droplet,
  Trash2,
  Search,
  Clock,
} from 'lucide-react';
import { customerAPI } from '../../services/api';
import './Customer.css';

const iconPalette = [
  { Icon: Home, colorClass: 'icon-blue' },
  { Icon: Sparkles, colorClass: 'icon-purple' },
  { Icon: Sofa, colorClass: 'icon-green' },
  { Icon: Package, colorClass: 'icon-orange' },
  { Icon: Droplet, colorClass: 'icon-cyan' },
  { Icon: Trash2, colorClass: 'icon-pink' },
];

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await customerAPI.getServices();
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dịch vụ:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const name = service.serviceName?.toLowerCase() || '';
      const description = service.description?.toLowerCase() || '';
      const keyword = searchTerm.toLowerCase();
      return name.includes(keyword) || description.includes(keyword);
    });
  }, [services, searchTerm]);

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Liên hệ để biết giá';
    return `${Number(price).toLocaleString()} VNĐ/m²`;
  };

  const formatDuration = (duration) => {
    if (!duration) return 'Thỏa thuận';
    return `${duration} phút`;
  };

  return (
    <div className="customer-services modern-services-page">
      <div className="services-hero">
        <div className="services-hero-content">
          <p className="services-hero-subtitle">Dịch vụ dành cho bạn</p>
          <h1>Dịch vụ của chúng tôi</h1>
          <p>
            Lựa chọn gói vệ sinh phù hợp với nhu cầu. Tất cả dịch vụ đều được thực hiện bởi đội ngũ
            chuyên nghiệp và quy trình chuẩn hóa.
          </p>
        </div>

        <div className="services-search">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="services-content">
        {loading ? (
          <div className="services-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p>Đang tải dịch vụ...</p>
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="services-grid-modern">
            {filteredServices.map((service, index) => {
              const { Icon, colorClass } = iconPalette[index % iconPalette.length];
              return (
                <div key={service.id} className="service-card-modern">
                  <div className="service-card-modern-body">
                    <div className={`service-icon-badge ${colorClass}`}>
                      <Icon className="service-icon-svg" />
                    </div>
                    <h3>{service.serviceName}</h3>
                    <p className="service-description-modern">
                      {service.description || 'Dịch vụ dọn dẹp chuyên nghiệp, tận tâm.'}
                    </p>

                    <div className="service-meta">
                      <div className="service-meta-row">
                        <span className="label">Giá</span>
                        <span className="value price">{formatPrice(service.basicPrice)}</span>
                      </div>
                      <div className="service-meta-row">
                        <span className="label">
                          <Clock className="clock-icon" />
                          Thời gian
                        </span>
                        <span className="value">{formatDuration(service.duration)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="service-card-modern-footer">
                    <Link
                      to={`/customer/book-service?serviceId=${service.id}`}
                      className="service-primary-btn"
                    >
                      Đặt dịch vụ
                    </Link>
                    <Link
                      to={`/customer/services/${service.id}`}
                      className="service-secondary-btn"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="services-empty-state">
            <div className="empty-icon">
              <Search className="empty-icon-svg" />
            </div>
            <h3>Không tìm thấy dịch vụ</h3>
            <p>Vui lòng thử lại với từ khóa khác hoặc điều chỉnh bộ lọc tìm kiếm.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;

