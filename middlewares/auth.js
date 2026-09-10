const { verifyToken } = require('../utils/jwtHelper');

function auth(allowedRoles = true) {
  return (req, res, next) => {
    const header = req.header('Authorization');
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = decoded;

        if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
          if (!req.user.role || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
              success: false,
              error: 'Bạn không có quyền truy cập chức năng này'
            });
          }
        }

        return next();
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (req.session && req.session.user) {
      req.user = {
        id: req.session.user.id,
        userId: req.session.user.id,    
        email: req.session.user.email,
        role: req.session.user.role,
        name: req.session.user.name,
        username: req.session.user.username
      };

      if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        if (!req.user.role || !allowedRoles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Bạn không có quyền truy cập chức năng này'
          });
        }
      }

      return next();
    }

    if (allowedRoles !== false) {
      return res.status(401).json({ error: 'No token or session provided' });
    }

    return next(); 
  };
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Vui lòng đăng nhập để truy cập'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Bạn không có quyền truy cập. Chỉ admin mới được phép.'
    });
  }

  next();
}

function requireCustomer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Vui lòng đăng nhập để truy cập'
    });
  }

  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Bạn không có quyền truy cập. Chỉ khách hàng mới được phép.'
    });
  }

  next();
}

function requireEmployee(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Vui lòng đăng nhập để truy cập'
    });
  }

  if (req.user.role !== 'employee') {
    return res.status(403).json({
      success: false,
      error: 'Bạn không có quyền truy cập. Chỉ nhân viên mới được phép.'
    });
  }

  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Vui lòng đăng nhập để truy cập'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền truy cập chức năng này'
      });
    }

    next();
  };
}

module.exports = { auth, requireAdmin, requireCustomer, requireEmployee, requireRole };
