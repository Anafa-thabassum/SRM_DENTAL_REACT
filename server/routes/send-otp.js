import { Router } from 'express';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { createTransport } from 'nodemailer';

dotenv.config();
const router = Router();

// Simple in-memory store for OTPs (use Redis or database in production)
const otpStore = new Map();

// Email setup with fallback for development
const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD, 
  },
});


// Add validation middleware
router.post('/send-otp', async (req, res) => {
  console.log('📧 OTP request received:', req.body);
  
  const { name, email, phone, method } = req.body;

  // Validate required fields
  if (!name || !method) {
    console.log('❌ Missing required fields: name or method');
    return res.status(400).json({ 
      success: false, 
      message: 'Name and method are required' 
    });
  }

  if (method === 'email' && !email) {
    console.log('❌ Email required for email method');
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required when method is email' 
    });
  }

  if (method === 'phone' && !phone) {
    console.log('❌ Phone required for phone method');
    return res.status(400).json({ 
      success: false, 
      message: 'Phone is required when method is phone' 
    });
  }

  if (method !== 'email' && method !== 'phone') {
    console.log('❌ Invalid method:', method);
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid method. Use "email" or "phone"' 
    });
  }

  try {
    // Check if user already exists with the provided email or phone
    let existing = null;
    if (email) {
      existing = await User.findOne({ email });
    }
    if (!existing && phone) {
      existing = await User.findOne({ phone });
    }
    
    console.log('🔍 Existing user check:', existing);

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or phone already exists' 
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const identifier = method === 'email' ? email : phone;
    
    // Store OTP with expiration (10 minutes)
    otpStore.set(identifier, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      method,
      name
    });

    console.log(`📝 Stored OTP for ${identifier}: ${otp}`);

    if (method === 'email') {
      try {
        // Check if email credentials are available
        if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
          console.warn('⚠️ Email credentials not found. OTP will be logged to console only.');
          console.log(`📧 [DEV] OTP for ${email}: ${otp}`);
        } else {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: 'SRM Dental OTP Verification',
            html: `Hi ${name},<br><br>Your OTP is: <strong>${otp}</strong><br><br>Thank you,<br>SRM Dental College`
          });
          console.log(`✅ OTP email sent to: ${email}`);
        }
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        console.log(`📧 [DEV] OTP for ${email}: ${otp}`);
      }
    } else if (method === 'phone') {
      console.log(`📱 [DEV Mode] OTP for ${phone}: ${otp}`);
    }

    res.json({ 
      success: true, 
      message: 'OTP sent successfully'
    });

  } catch (err) {
    console.error('❌ OTP Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during OTP sending' 
    });
  }
});

// New OTP verification endpoint
router.post('/verify-otp', async (req, res) => {
  console.log('🔍 OTP verification request:', req.body);
  
  const { email, phone, method, otp } = req.body;

  try {
    const identifier = method === 'email' ? email : phone;
    const storedData = otpStore.get(identifier);

    // Clean up expired OTPs
    const now = Date.now();
    for (const [key, data] of otpStore.entries()) {
      if (data.expiresAt < now) {
        otpStore.delete(key);
      }
    }

    if (!storedData) {
      console.log('❌ No OTP found for:', identifier);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP expired or not found. Please request a new OTP.' 
      });
    }

    if (storedData.expiresAt < now) {
      otpStore.delete(identifier);
      console.log('❌ OTP expired for:', identifier);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    if (storedData.otp === otp) {
      // OTP is valid - remove it from store
      otpStore.delete(identifier);
      console.log('✅ OTP verified successfully for:', identifier);
      
      return res.json({ 
        success: true, 
        message: 'OTP verified successfully' 
      });
    } else {
      console.log('❌ Invalid OTP for:', identifier);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP. Please try again.' 
      });
    }
  } catch (err) {
    console.error('❌ OTP verification error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during OTP verification' 
    });
  }
});

router.post("/update", async (req, res) => {
  const { Identity, name, email, phone } = req.body;

  try {
    let patient = await User.findOne({ Identity });

    if (!patient) {
      // If not found, create new but check uniqueness
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: "Phone already exists" });
      }

      patient = new User({ Identity, name, email, phone });
      await patient.save();
      return res.json({ success: true, message: "New patient created", patient });
    }

    // If updating -> check phone uniqueness (ignore same patient's current phone)
    if (phone && phone !== patient.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: "Phone already exists" });
      }
      patient.phone = phone;
    }

    if (name) patient.name = name;
    if (email) patient.email = email;

    await patient.save();
    return res.json({ success: true, message: "Patient updated", patient });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post('/send-otp-reset', async (req, res) => {
  console.log('📧 OTP request received:', req.body);
  
  const { name, email, phone, method } = req.body;

  // Validate required fields
  if (!name || !method) {
    console.log('❌ Missing required fields: name or method');
    return res.status(400).json({ 
      success: false, 
      message: 'Name and method are required' 
    });
  }

  if (method === 'email' && !email) {
    console.log('❌ Email required for email method');
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required when method is email' 
    });
  }

  if (method === 'phone' && !phone) {
    console.log('❌ Phone required for phone method');
    return res.status(400).json({ 
      success: false, 
      message: 'Phone is required when method is phone' 
    });
  }

  if (method !== 'email' && method !== 'phone') {
    console.log('❌ Invalid method:', method);
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid method. Use "email" or "phone"' 
    });
  }

  try {
    // Check if user already exists with the provided email or phone
    let existing = null;
    if (email) {
      existing = await User.findOne({ email });
    }
    if (existing && phone) {
      existing = await User.findOne({ phone });
    }
    
    console.log('🔍 Existing user check:', existing);

    if (existing) {

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const identifier = method === 'email' ? email : phone;
    
    // Store OTP with expiration (10 minutes)
    otpStore.set(identifier, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      method,
      name
    });

    console.log(`📝 Stored OTP for ${identifier}: ${otp}`);
  }
    if (method === 'email') {
      try {
        // Check if email credentials are available
        if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
          console.warn('⚠️ Email credentials not found. OTP will be logged to console only.');
          console.log(`📧 [DEV] OTP for ${email}: ${otp}`);
        } else {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: 'SRM Dental OTP Verification',
            html: `Hi ${name},<br><br>Your OTP is: <strong>${otp}</strong><br><br>Thank you,<br>SRM Dental College`
          });
          console.log(`✅ OTP email sent to: ${email}`);
        }
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        console.log(`📧 [DEV] OTP for ${email}: ${otp}`);
      }
    } else if (method === 'phone') {
      console.log(`📱 [DEV Mode] OTP for ${phone}: ${otp}`);
    }

    res.json({ 
      success: true, 
      message: 'OTP sent successfully'
    });

  } catch (err) {
    console.error('❌ OTP Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during OTP sending' 
    });
  }
});

export default router;