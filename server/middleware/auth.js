// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    const user = await User.findOne({ 
      _id: decoded.userId 
    }).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token invalid' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Token invalid' 
    });
  }
};

export default auth;