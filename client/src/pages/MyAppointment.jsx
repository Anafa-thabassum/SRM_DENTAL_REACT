// MyAppointment.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyAppointment.css";

const MyAppointment = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const patientId = localStorage.getItem("patientId");

  useEffect(() => {
    if (patientId) {
      fetchAppointments();
    } else {
      setError("Please log in to view your appointments");
      setLoading(false);
    }
  }, [patientId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/appointment/appointments/${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': "Bearer "+localStorage.getItem("token")
        },
      });

      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments);
      } else {
        setError('Failed to load appointments.');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/appointment/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': "Bearer "+localStorage.getItem("token")
        },
        body: JSON.stringify({ patientId }),
      });

      const data = await response.json();

      if (data.success) {
        fetchAppointments();
        alert('Appointment cancelled successfully.');
      } else {
        alert('Failed to cancel appointment.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Unable to cancel appointment. Please try again later.');
    }
  };

  const handleReschedule = async (appointment) => {
    if (!window.confirm("Are you sure you want to reschedule this appointment? Your current appointment will be cancelled.")) {
      return;
    }

    try {
      // First cancel the current appointment
      const cancelResponse = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/appointment/appointments/${appointment.bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': "Bearer "+localStorage.getItem("token")
        },
        body: JSON.stringify({ patientId }),
      });

      const cancelData = await cancelResponse.json();

      if (cancelData.success) {
        // Then navigate to booking page with old appointment details
        navigate('/slot-booking', { 
          state: { 
            reschedule: true,
            oldAppointmentId: appointment.bookingId,
            chiefComplaint: appointment.chiefComplaint,
            currentDate: appointment.appointmentDate,
            currentTime: appointment.appointmentTime
          }
        });
      } else {
        alert('Failed to cancel appointment for rescheduling.');
      }
    } catch (error) {
      console.error('Error during reschedule:', error);
      alert('Unable to process rescheduling. Please try again later.');
    }
  };

  const getStatusTag = (status, appointmentDate, appointmentTime) => {
    console.log('Checking status for:', appointmentDate, appointmentTime, 'Current status:', status);
    
    const now = new Date();
    console.log('Current time:', now.toString());
    
    try {
      // Convert time to 24-hour format for proper parsing
      const time24 = convertTo24Hour(appointmentTime);
      console.log('Converted time to 24h:', time24);
      
      const appointmentDateTime = new Date(`${appointmentDate}T${time24}`);
      console.log('Appointment datetime:', appointmentDateTime.toString());
      
      if (isNaN(appointmentDateTime.getTime())) {
        console.error('Invalid date format');
        return <span className="status-tag status-waiting">Waiting for Confirmation</span>;
      }
      
      if (now > appointmentDateTime && status !== 'cancelled' && status !== 'confirmed') {
        console.log('Appointment is expired');
        return <span className="status-tag status-expired">Expired</span>;
      }

      switch (status) {
        case 'confirmed':
          return <span className="status-tag status-confirmed">Confirmed</span>;
        case 'cancelled':
          return <span className="status-tag status-cancelled">Cancelled</span>;
        case 'rescheduled':
          return <span className="status-tag status-rescheduled">Rescheduled</span>;
        default:
          return <span className="status-tag status-waiting">Waiting for Confirmation</span>;
      }
    } catch (error) {
      console.error('Error in getStatusTag:', error);
      return <span className="status-tag status-waiting">Waiting for Confirmation</span>;
    }
  };

  // Improved time conversion function
  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return '00:00';
    
    console.log('Converting time:', timeStr);
    
    // Handle already 24-hour format
    if (timeStr.includes(':')) {
      const [timePart, modifier] = timeStr.split(' ');
      
      if (!modifier) {
        // Already in 24-hour format
        return timePart;
      }
      
      let [hours, minutes] = timePart.split(':');
      
      if (modifier.toUpperCase() === 'PM' && hours !== '12') {
        hours = String(parseInt(hours, 10) + 12);
      } else if (modifier.toUpperCase() === 'AM' && hours === '12') {
        hours = '00';
      }
      
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    return '00:00';
  };

  // Check if appointment is in the future
  const isFutureAppointment = (appointmentDate, appointmentTime) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${convertTo24Hour(appointmentTime)}`);
    return appointmentDateTime > now;
  };

  if (loading) {
    return (
      <div className="appointment-dashboard">
        <header className="portal-header">
          <div className="header-left">
            <div className="logo">
              <img src="/logo.png" alt="Clinic Logo" className="logo-img-user" />
            </div>
            <div>
              <h3 className="logo-text">SRM Dental College</h3>
            </div>
          </div>
          <button 
            onClick={() => navigate('/patient-dashboard')}
            className="btn-back-dashboard"
          >
            Back to Dashboard
          </button>
        </header>
        <div className="loading-container">
          <p>Loading your appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="appointment-dashboard">
        <header className="portal-header">
          <div className="header-left">
            <div className="logo">
              <img src="/logo.png" alt="Clinic Logo" className="logo-img-user" />
            </div>
            <div>
              <h3 className="logo-text">SRM Dental College</h3>
            </div>
          </div>
          <button 
            onClick={() => navigate('/patient-dashboard')}
            className="btn-back-dashboard"
          >
            Back to Dashboard
          </button>
        </header>
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-dashboard">
      <header className="portal-header">
        <div className="header-left">
          <div className="logo">
            <img src="/logo.png" alt="Clinic Logo" className="logo-img-user" />
          </div>
          <div>
            <h3 className="logo-text">SRM Dental College</h3>
          </div>
        </div>
        <button 
          onClick={() => navigate('/patient-dashboard')}
          className="btn-back-dashboard"
        >
          Back to Dashboard
        </button>
      </header>
      
      <main className="container">
        <h1>My Appointments</h1>
        
        {appointments.length === 0 ? (
          <div className="no-appointments">
            <p>You don't have any appointments yet.</p>
            <button 
              onClick={() => navigate('/slot-booking')}
              className="btn-book-now"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="appointment-table">
              <thead>
                <tr>
                  <th>Appointment No.</th>
                  <th>Complaint</th>
                  <th>Appt. Date & Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.bookingId}>
                    <td>
                      {appointment.bookingId}
                      {appointment.rescheduled && (
                        <span
                          className="reschedule-dot"
                          title="Rescheduled"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </td>
                    <td>{appointment.chiefComplaint}</td>
                    <td>{appointment.appointmentDate} {appointment.appointmentTime}</td>
                    <td>
                      {getStatusTag(appointment.status, appointment.appointmentDate, appointment.appointmentTime)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {appointment.status !== 'cancelled' && 
                         appointment.status !== 'expired' &&
                         isFutureAppointment(appointment.appointmentDate, appointment.appointmentTime) ? (
                          <>
                            <a 
                              onClick={(e) => {
                                e.preventDefault();
                                handleReschedule(appointment);
                              }}
                              href="/slot-booking" 
                              className="btn-reschedule"
                            >
                              Reschedule
                            </a>
                            <a 
                              onClick={(e) => {
                                e.preventDefault();
                                handleCancelAppointment(appointment.bookingId);
                              }}
                              href="#" 
                              className="btn-cancel"
                            >
                              Cancel
                            </a>
                          </>
                        ) : (
                          <span className="no-actions">No actions available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyAppointment;