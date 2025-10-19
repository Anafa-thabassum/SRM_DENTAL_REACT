// server/routes/appointment.js
import { Appointment } from '../models/AppoitmentBooked.js';
import dotenv from 'dotenv';
import express, { Router, json } from 'express';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import {User} from '../models/User.js';

dotenv.config();
const router = Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

// server/routes/appointment.js - Fix auth middleware
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findOne({
      "_id": decoded.userId
    })

    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid. User not found.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

// Generate unique booking ID
const generateBookingId = () => {
  return `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// API Routes

// Get booked slots for a specific date
router.get('/booked-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const bookedAppointments = await Appointment.find({
      appointmentDate: date,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    // Create a map of booked time slots
    const bookedSlots = {};
    bookedAppointments.forEach(appointment => {
      const slotKey = `${date}_${appointment.appointmentTime}`;
      bookedSlots[slotKey] = 'booked';
    });
    
    res.json({
      success: true,
      bookedSlots});
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({ message: 'Server error fetching booked slots' });
  }
});

// Create new appointment
router.post('/appointments', async (req, res) => {
  try {
    const { patientId, patientEmail, chiefComplaint, appointmentDate, appointmentTime } = req.body;
    
    const bookingId = generateBookingId();
    
    const newAppointment = new Appointment({
      bookingId,
      patientId,
      patientEmail,
      chiefComplaint,
      appointmentDate,
      appointmentTime,
      status: 'pending',
    });
    
    await newAppointment.save();
    
    // Send confirmation email
    const emailSubject = 'Appointment Booked Successfully';
    const emailHtml = `
      <h2>Your Appointment has been Booked</h2>
      <p>Dear Patient,</p>
      <p>Your appointment has been successfully booked with the following details:</p>
      <ul>
        <li><strong>Booking ID:</strong> ${bookingId}</li>
        <li><strong>Date:</strong> ${appointmentDate}</li>
        <li><strong>Time:</strong> ${appointmentTime}</li>
        <li><strong>Chief Complaint:</strong> ${chiefComplaint}</li>
      </ul>
      <p>Your appointment will be confirmed once a doctor approves it. You will receive another email with the confirmed details.</p>
      <p>Thank you for choosing our service.</p>
    `;
    
    await sendEmail(patientEmail, emailSubject, emailHtml);
    
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      bookingId,
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
    });
  }
});

// Get all appointments with doctor-specific confirmation status
router.get('/all-appointments', auth, async (req, res) => {
  try {
    const doctorId = req.user.Identity;
    
    // Get all appointments
    const allAppointments = await Appointment.find({})
      .sort({ appointmentDate: -1, appointmentTime: -1 });
    
    // Add a field to indicate if this doctor confirmed the appointment
    const appointmentsWithConfirmationStatus = allAppointments.map(appointment => ({
      ...appointment.toObject(),
      confirmedByMe: appointment.approvedDoctorId === doctorId
    }));
    
    res.status(200).json({
      success: true,
      appointments: appointmentsWithConfirmationStatus,
    });
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
    });
  }
});


//get patient specific appointment id
router.get('/appointments/:id', auth, async (req, res) => {
  try{
    const patientID = req.params.id;

    const allAppointments = await Appointment.find({patientId: patientID})
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json({
      success: true,
      appointments: allAppointments
    })

  } catch (err){
        console.log(error)
        res.status(500).json({
          success: false,
          message: 'error occured while fetching appointment'
        })
  }
})





// Get pending appointments
router.get('/pending', auth, async (req, res) => {
  try {
    // Get all pending appointments
    const appointments = await Appointment.find({ 
      status: 'pending'
    });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching pending appointments:', error);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// Confirm appointment
router.post('/appointments/:id/confirm', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ bookingId: req.params.id });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment is already taken
    if (appointment.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Appointment has already been processed' 
      });
    }

    // Update appointment status and assign to doctor
    appointment.status = 'confirmed';
    appointment.doctorId = req.user.Identity;
    appointment.approvedDoctorId = req.user.Identity;
    appointment.updatedAt = new Date();
    
    await appointment.save();
    
    // Get patient details for email
    const patient = await User.findOne({ Identity: appointment.patientId });
    
    // Send confirmation notification to patient
    if (appointment.patientEmail) {
      await sendEmail({
        to: appointment.patientEmail,
        subject: 'Appointment Confirmed - SRM Dental College',
        html: `
          <h2>Your Appointment Has Been Confirmed</h2>
          <p>Dear ${patient?.name || 'Patient'},</p>
          <p>Your appointment has been confirmed with the following details:</p>
          <ul>
            <li><strong>Booking ID:</strong> ${appointment.bookingId}</li>
            <li><strong>Date:</strong> ${new Date(appointment.appointmentDate).toDateString()}</li>
            <li><strong>Time:</strong> ${appointment.appointmentTime}</li>
            <li><strong>Chief Complaint:</strong> ${appointment.chiefComplaint}</li>
            <li><strong>Doctor:</strong> Dr. ${req.user.name}</li>
            <li><strong>Doctor ID:</strong> ${req.user.Identity}</li>
          </ul>
          <p>Please arrive 15 minutes before your scheduled time.</p>
          <p>Thank you for choosing SRM Dental College.</p>
        `
      });
    }
    
    res.json({ 
      message: 'Appointment confirmed successfully',
      appointment 
    });
  } catch (error) {
    console.error('Error confirming appointment:', error);
    res.status(500).json({ message: 'Server error confirming appointment' });
  }
});

// Reschedule appointment
router.post('/appointments/:id/reschedule', auth, async (req, res) => {
  try {
    const { newDate, newTime } = req.body;
    
    const appointment = await Appointment.findOne({ bookingId: req.params.id });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if new time slot is available
    const conflictingAppointment = await Appointment.findOne({
      appointmentDate: newDate,
      appointmentTime: newTime,
      status: { $in: ['pending', 'confirmed'] },
      bookingId: { $ne: req.params.id }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ message: 'Time slot is already booked' });
    }

    // Store previous appointment details
    const previousDate = appointment.appointmentDate;
    const previousTime = appointment.appointmentTime;
    
    // Create a new booking ID for the rescheduled appointment
    const newBookingId = `RS${Date.now()}`;
    
    // Create new appointment for rescheduling
    const rescheduledAppointment = new Appointment({
      bookingId: newBookingId,
      patientId: appointment.patientId,
      patientEmail: appointment.patientEmail,
      doctorId: req.user.Identity,
      approvedDoctorId: req.user.Identity,
      chiefComplaint: appointment.chiefComplaint,
      appointmentDate: newDate,
      appointmentTime: newTime,
      status: 'confirmed',
      originalBookingId: appointment.bookingId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Update original appointment status
    appointment.status = 'rescheduled';
    appointment.updatedAt = new Date();
    
    await Promise.all([appointment.save(), rescheduledAppointment.save()]);
    
    // Get patient details for email
    const patient = await User.findOne({ Identity: appointment.patientId });
    
    // Send reschedule notification to patient
    if (appointment.patientEmail) {
      await sendEmail({
        to: appointment.patientEmail,
        subject: 'Appointment Rescheduled - SRM Dental College',
        html: `
          <h2>Your Appointment Has Been Rescheduled</h2>
          <p>Dear ${patient?.name || 'Patient'},</p>
          <p>Your appointment has been rescheduled with the following new details:</p>
          <ul>
            <li><strong>New Booking ID:</strong> ${newBookingId}</li>
            <li><strong>New Date:</strong> ${new Date(newDate).toDateString()}</li>
            <li><strong>New Time:</strong> ${newTime}</li>
            <li><strong>Previous Date:</strong> ${new Date(previousDate).toDateString()}</li>
            <li><strong>Previous Time:</strong> ${previousTime}</li>
            <li><strong>Chief Complaint:</strong> ${appointment.chiefComplaint}</li>
            <li><strong>Doctor:</strong> Dr. ${req.user.name}</li>
            <li><strong>Doctor ID:</strong> ${req.user.Identity}</li>
          </ul>
          <p>Please make note of the new appointment time and booking ID.</p>
          <p>Thank you for choosing SRM Dental College.</p>
        `
      });
    }
    
    res.json({ 
      message: 'Appointment rescheduled successfully',
      newAppointment: rescheduledAppointment,
      originalAppointment: appointment
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ message: 'Server error rescheduling appointment' });
  }
});

// Cancel an appointment
router.put('/appointments/:bookingId/cancel', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { patientId } = req.body;
    
    const appointment = await Appointment.findOne({ bookingId, patientId });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }
    
    // Check if appointment is in the future
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    if (new Date() > appointmentDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel past appointments',
      });
    }
    
    appointment.status = 'cancelled';
    appointment.updatedAt = new Date();
    
    await appointment.save();
    
    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
    });
  }
});

// Get appointment by booking ID
router.get('/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const appointment = await Appointment.findOne({ bookingId });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Server error fetching appointment' });
  }
});

// Add automatic status checking (run this periodically)
const checkExpiredAppointments = async () => {
  try {
    const now = new Date();
    const appointments = await Appointment.find({
      status: { $in: ['booked', 'confirmed'] },
      appointmentDate: { $lte: now.toISOString().split('T')[0] }
    });
    
    for (const appointment of appointments) {
      const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
      if (now > appointmentDateTime) {
        appointment.status = 'expired';
        appointment.updatedAt = new Date();
        await appointment.save();
      }
    }
  } catch (error) {
    console.error('Error checking expired appointments:', error);
  }
};

// Run every hour
setInterval(checkExpiredAppointments, 60 * 60 * 1000);

export default router;