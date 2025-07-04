const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'No authorization header provided',
        code: 'NO_AUTH_HEADER'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded.id || !decoded.role) {
        return res.status(401).json({ 
          message: 'Invalid token payload',
          code: 'INVALID_TOKEN_PAYLOAD'
        });
      }

      req.user = {
        _id: decoded.id,  // Note: using 'id' from payload
        role: decoded.role,
        email: decoded.email || null  // Optional email
      };
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ 
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!req.user.role) {
      return res.status(401).json({ 
        message: 'User role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Insufficient permissions. Required roles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};