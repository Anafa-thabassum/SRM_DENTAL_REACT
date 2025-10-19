// AppoitmentBooked.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, required: true },
  patientId: { type: String, required: true },
  patientEmail: { type: String, required: true },
  doctorId: { type: String, default: null },
  approvedDoctorId: { type: String, default: null },
  chiefComplaint: { type: String, required: true },
  appointmentDate: { type: String, required: true },
  appointmentTime: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'rescheduled', 'cancelled'], default: 'pending' },
  originalBookingId: { type: String, default: null }, // For tracking rescheduled appointments
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);