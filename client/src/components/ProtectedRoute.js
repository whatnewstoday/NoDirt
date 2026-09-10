import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userType, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = allowedRoles && allowedRoles.length > 0 
      ? `/${allowedRoles[0]}/login` 
      : '/';
    return <Navigate to={loginPath} replace />;
  }
  
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userType)) {
    return <Navigate to={`/${userType}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;

