// server/routes/Auth.js
import { User } from '../models/User.js';
import { hash, compare } from 'bcryptjs';
import pkg from 'jsonwebtoken';
const { sign } = pkg;
import dotenv from 'dotenv';
import express,{ Router,json } from 'express';

dotenv.config();
const router = Router();


// ➤ Route: POST /signup
router.post('/signup', async (req, res) => {
  const { name, phone, email, password, role, Identity } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User with this email already exists' });

    // Hash password
    const hashedPassword = await hash(password, 10);
    let finalIdentity = Identity; // use provided ID for doctor/admin
if (role === 'patient') {
  let unique = false;
  while (!unique) {
    const candidate = "U" + Math.floor(100000 + Math.random() * 900000);
    const exists = await User.findOne({ Identity: candidate });
    if (!exists) {
      finalIdentity = candidate;   // ✅ assign to separate variable
      unique = true;
    }
  }
}

const newUser = new User({
  name,
  phone,
  email,
  password: hashedPassword,
  role,
  Identity: finalIdentity   
});

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', Identity: newUser.Identity });
    
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// ➤ Route: POST /login
router.post('/login/adminlogin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    // Check password
    const isMatch = await compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid password' });

    // Generate token
    const token = sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '2h' }
    );

    // Return role and token
    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      name: user.name,
      Identity: user.Identity
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/login/patientlogin', async (req, res) => {
  const { identifier, password } = req.body;
  console.log("➡️ Login attempt with identifier:", identifier);

  try {
    const user = await User.findOne({
      $or: [
        { Identity: identifier },
        { phone: identifier }
      ]
    });

    console.log("🔍 Found user:", user);

    if (!user) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // check password
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      name: user.name,
      Identity: user.Identity
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.get('/email-retrieve/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Find user by Identity (patientId from URL)
    const user = await User.findOne({ Identity: patientId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.status(200).json({
      success: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Error fetching patient email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient information',
    });
  }
});

router.post('/login/doctorlogin', async (req, res) => {
  const { email, password, Identity } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    // Verify role = doctor
    if (user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Not a doctor.' });
    }

    // Verify Identity matches DB
    if (user.Identity !== Identity) {
      return res.status(401).json({ message: 'Invalid Doctor ID' });
    }

    // Check password
    const isMatch = await compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid password' });

    // Generate JWT
    const token = sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      name: user.name,
      Identity: user.Identity
    });
  } catch (err) {
    console.error('Doctor Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// routes/auth.js - Admin Login Route
router.post('/login/adminlogin', async (req, res) => {
  const { email, password, Identity } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    // Verify role = admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Not an administrator.' });
    }

    // Verify Identity matches DB
    if (user.Identity !== Identity) {
      return res.status(401).json({ message: 'Invalid Admin ID' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid password' });

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      name: user.name,
      Identity: user.Identity
    });
  } catch (err) {
    console.error('Admin Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Password reset route
// Check if user exists
router.post('/check-user', async (req, res) => {
  const { email, phone } = req.body;
  
  try {
    let user = null;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    }
    
    res.json({ exists: !!user });
  } catch (err) {
    console.error('Check user error:', err);
    res.status(500).json({ message: 'Server error checking user' });
  }
});

// Password reset route
router.post('/reset-password', async (req, res) => {
  const { email, phone, password } = req.body;
  
  try {
    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Hash new password
    const hashedPassword = await hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during password reset' 
    });
  }
});

export default router;
