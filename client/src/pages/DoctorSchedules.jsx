import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DoctorSchedules.css';

const DoctorSchedule = () => {
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  // Sample data for demonstration
  const sampleAppointments = [
    {
      bookingId: 'BK009201',
      patientId: 'U1444',
      patientName: 'Arun',
      patientEmail: 'arun@example.com',
      appointmentDate: '2023-10-15',
      appointmentTime: '10:00 AM',
      chiefComplaint: 'Toothache and sensitivity',
      status: 'pending',
      confirmedByMe: false,
      doctorId: 'DOC123'
    },
    {
      bookingId: 'BK007921',
      patientId: 'U1444',
      patientName: 'Arun',
      patientEmail: 'arun@example.com',
      appointmentDate: '2023-10-15',
      appointmentTime: '10:00 AM',
      chiefComplaint: 'Toothache and sensitivity',
      status: 'confirmed',
      confirmedByMe: false,
      doctorId: 'DOC123'
    },
    {
      bookingId: 'BK004222',
      patientId: 'U1445',
      patientName: 'Patient 1',
      patientEmail: 'patient1@example.com',
      appointmentDate: '2023-10-15',
      appointmentTime: '11:30 AM',
      chiefComplaint: 'Regular dental checkup',
      status: 'confirmed',
      confirmedByMe: true,
      doctorId: 'DOC123',
      approvedDoctorId: 'DOC123'
    },
    {
      bookingId: 'BK004223',
      patientId: 'U0003',
      patientName: 'Patient 2',
      patientEmail: 'patient2@example.com',
      appointmentDate: '2023-10-16',
      appointmentTime: '9:00 AM',
      chiefComplaint: 'Root canal treatment',
      status: 'pending',
      confirmedByMe: false,
      doctorId: 'DOC123'
    },
    {
      bookingId: 'BK057504',
      patientId: 'U1443',
      patientName: 'Patient 3',
      patientEmail: 'patient3@example.com',
      appointmentDate: '2023-10-16',
      appointmentTime: '2:30 PM',
      chiefComplaint: 'Teeth cleaning and whitening',
      status: 'confirmed',
      confirmedByMe: false,
      doctorId: 'DOC123',
      approvedDoctorId: 'DOC456'
    },
    {
      bookingId: 'BK004335',
      patientId: 'U0005',
      patientName: 'Patient 4',
      patientEmail: 'patient4@example.com',
      appointmentDate: '2023-10-17',
      appointmentTime: '4:00 PM',
      chiefComplaint: 'Dental implant consultation',
      status: 'cancelled',
      confirmedByMe: false,
      doctorId: 'DOC123'
    }
  ];

  // working hours configuration
  const workingStartTime = 9 * 60;
  const workingEndTime = 17 * 60;
  const slotDuration = 30;
  const lunchBreak = [13 * 60, 14 * 60];
  const snackBreak1 = [11 * 60, 11 * 60 + 10];
  const snackBreak2 = [15 * 60, 15 * 60 + 10];

  useEffect(() => {
    // Use sample data instead of fetching from backend
    setAppointments(sampleAppointments);
  }, []);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login if no token
        window.location.href = '/login';
        return;
      }
      
      // Optional: Check if token is expired before making API call
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (isExpired) {
          showMessage('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
      } catch (error) {
        console.error('Token parsing error:', error);
      }
    };

    checkToken();
  }, []);

  const formatMinutesToTime = (mins) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = minutes < 10 ? '0' + minutes : minutes;
    return `${h}:${m} ${ampm}`;
  };

  const isDuringBreak = (start, end, breaks) => {
    return breaks.some(([bStart, bEnd]) => start < bEnd && end > bStart);
  };

  const generateDoctorTimeSlots = () => {
    const slots = [];
    const breaks = [lunchBreak, snackBreak1, snackBreak2];
    let current = workingStartTime;

    while (current < workingEndTime) {
      const end = current + slotDuration;
      if (end <= workingEndTime && !isDuringBreak(current, end, breaks)) {
        slots.push({ start: current, end, time: formatMinutesToTime(current) });
      }
      let next = current + slotDuration;
      if (current < lunchBreak[0] && next >= lunchBreak[0]) {
        next = lunchBreak[1];
      } else if (current < snackBreak1[0] && next >= snackBreak1[0]) {
        next = snackBreak1[1];
      } else if (current < snackBreak2[0] && next >= snackBreak2[0]) {
        next = snackBreak2[1];
      }
      current = next;
    }
    return slots;
  };

  const generateUpcomingDates = (numDays) => {
    const dates = [];
    const today = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };

    for (let i = 0; i < numDays; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const yyyy = futureDate.getFullYear();
      const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
      const dd = String(futureDate.getDate()).padStart(2, '0');
      dates.push({
        fullDate: `${yyyy}-${mm}-${dd}`,
        displayDate: futureDate.toLocaleDateString('en-US', options)
      });
    }
    return dates;
  };

  const confirmAppointment = async (appointmentId) => {
    try {
      // In a real app, this would call the backend
      // For demo, we'll just update the local state
      const updatedAppointments = appointments.map(app => 
        app.bookingId === appointmentId 
          ? { ...app, status: 'confirmed', confirmedByMe: true, approvedDoctorId: 'DOC123' }
          : app
      );
      setAppointments(updatedAppointments);
      showMessage('Appointment confirmed successfully', 'success');
    } catch (error) {
      showMessage('Error confirming appointment', 'error');
    }
  };

  const declineAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      // In a real app, this would call the backend
      // For demo, we'll just update the local state
      const updatedAppointments = appointments.map(app => 
        app.bookingId === appointmentId 
          ? { ...app, status: 'cancelled' }
          : app
      );
      setAppointments(updatedAppointments);
      showMessage('Appointment cancelled successfully', 'success');
    } catch (error) {
      showMessage('Error cancelling appointment', 'error');
    }
  };

  const selectNewDate = async (dateStr) => {
    setSelectedDate(dateStr);
    // For demo, we'll simulate some booked slots
    const simulatedBookedSlots = {
      [`${dateStr}_10:00 AM`]: true,
      [`${dateStr}_11:30 AM`]: true,
      [`${dateStr}_2:00 PM`]: true
    };
    setBookedSlots(simulatedBookedSlots);
  };

  const rescheduleAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      showMessage('Please select a new date and time', 'error');
      return;
    }
    try {
      // In a real app, this would call the backend
      // For demo, we'll just update the local state
      const updatedAppointments = appointments.map(app => 
        app.bookingId === selectedAppointment.bookingId 
          ? { 
              ...app, 
              appointmentDate: selectedDate, 
              appointmentTime: selectedTime,
              status: 'rescheduled'
            }
          : app
      );
      setAppointments(updatedAppointments);
      showMessage('Appointment rescheduled successfully', 'success');
      setShowModal(false);
    } catch (error) {
      showMessage('Error rescheduling appointment', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const getStatusBadgeClass = (status, confirmedByMe) => {
    if (confirmedByMe && status === 'confirmed') {
      return 'status-confirmed-by-me';
    }
    
    switch (status.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'rescheduled': return 'status-rescheduled';
      default: return 'status-default';
    }
  };

  const getStatusDisplayText = (status, confirmedByMe) => {
    if (confirmedByMe && status === 'confirmed') {
      return 'CONFIRMED BY ME';
    }
    return status.toUpperCase();
  };

  const timeSlots = generateDoctorTimeSlots();
  const upcomingDates = generateUpcomingDates(4);

  return (
    <div className='DoctorSchedule-page'>
      <div className="doctor-schedule">
        {/* Message Box */}
        {message.text && (
          <div className={`message-box ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="schedule-container">
          <div className="schedule-header">
            <center>
              <img src="/logo.png" alt="SRM Logo" className="logo" style={{background:'blue' ,marginTop:'20px', borderRadius: '15px'}}/>
              <h1>SRM DENTAL COLLEGE</h1>
            </center>
          </div>

          <center><h2 className="section-title" style={{ color:'blue', textAlign: 'center'}}>All Appointments</h2></center>

          {/* Appointment List */}
          <div className="appointments-list">
            {appointments.length === 0 ? (
              <p className="no-appointments">No appointments found.</p>
            ) : (
              appointments.map(appointment => (
                <div key={appointment.bookingId} className="appointment-card">
                  <div className="appointment-header">
                    <span className={`status-badge ${getStatusBadgeClass(appointment.status, appointment.confirmedByMe)}`}>
                      {getStatusDisplayText(appointment.status, appointment.confirmedByMe)}
                    </span>
                    <span className="booking-id">ID: {appointment.bookingId}</span>
                  </div>
                  
                  <p><strong>Patient:</strong> {appointment.patientName} ({appointment.patientId})</p>
                  <p><strong>Email:</strong> {appointment.patientEmail}</p>
                  <p><strong>Date:</strong> {appointment.appointmentDate}</p>
                  <p><strong>Time:</strong> {appointment.appointmentTime}</p>
                  <p><strong>Reason:</strong> {appointment.chiefComplaint}</p>
                  
                  {appointment.doctorId && (
                    <p><strong>Doctor ID:</strong> {appointment.doctorId}</p>
                  )}
                  
                  {appointment.approvedDoctorId && (
                    <p><strong>Confirmed by:</strong> {appointment.approvedDoctorId}</p>
                  )}
                  
                  <div className="action-buttons">
                    {appointment.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => declineAppointment(appointment)}
                          className="btn-decline"
                        >
                          Reschedule
                        </button>
                        <button 
                          onClick={() => confirmAppointment(appointment.bookingId)}
                          className="btn-confirm"
                        >
                          Confirm
                        </button>
                      </>
                    )}
                    
                    {appointment.status === 'confirmed' && appointment.confirmedByMe && (
                      <button 
                        onClick={() => declineAppointment(appointment)}
                        className="btn-decline"
                      >
                        Reschedule
                      </button>
                    )}
                    
                    {(appointment.status === 'pending' || (appointment.status === 'confirmed' && appointment.confirmedByMe)) && (
                      <button 
                        onClick={() => cancelAppointment(appointment.bookingId)}
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reschedule Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="reschedule-modal">
              <h3>Reschedule Appointment</h3>
              <p>Patient: {selectedAppointment?.patientName} ({selectedAppointment?.patientId})</p>
              <p>Current: {selectedAppointment?.appointmentDate} at {selectedAppointment?.appointmentTime}</p>

              {!selectedDate ? (
                <>
                  <p className="modal-text">Select a New Date:</p>
                  <div className="date-grid">
                    {upcomingDates.map(date => (
                      <div 
                        key={date.fullDate}
                        onClick={() => selectNewDate(date.fullDate)}
                        className="date-slot"
                      >
                        {date.displayDate}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="modal-text">Available Slots for {selectedDate}:</p>
                  <div className="time-grid">
                    {timeSlots.map(slot => {
                      const slotKey = `${selectedDate}_${slot.time}`;
                      const isBooked = bookedSlots[slotKey];
                      return (
                        <div
                          key={slot.time}
                          onClick={() => !isBooked && setSelectedTime(slot.time)}
                          className={`time-slot ${
                            isBooked ? 'booked' : selectedTime === slot.time ? 'selected' : ''
                          }`}
                        >
                          {slot.time}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                {selectedDate && selectedTime && (
                  <button onClick={rescheduleAppointment} className="btn-reschedule">
                    Reschedule
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorSchedule;