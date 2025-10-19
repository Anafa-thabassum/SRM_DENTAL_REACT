// SlotBooking.jsx
import React, { useState, useEffect, useRef } from 'react';
import './SlotBooking.css';
import { useNavigate } from 'react-router-dom';

const SlotBooking = () => {
  const navigate = useNavigate();

  // State variables
  const [patientEmail, setPatientEmail] = useState('');
  const [fetchingEmail, setFetchingEmail] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [generalInput, setGeneralInput] = useState('');
  const [showGeneralInput, setShowGeneralInput] = useState(false);
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({});
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const patientId = localStorage.getItem("patientId");

  // Ref for cleanup
  const abortControllerRef = useRef(null);

  // Constants
  const workingStartTime = 9 * 60;
  const workingEndTime = 17 * 60;
  const slotDuration = 30;
  const lunchBreak = [13 * 60, 14 * 60];
  const snackBreak1 = [11 * 60, 11 * 60 + 10];
  const snackBreak2 = [15 * 60, 15 * 60 + 10];
  const MAX_SLOTS_PER_TIME = 5; // Maximum appointments per time slot

  const complaintOptions = [
    "Oral ulcer",
    "Dental caries",
    "Sensitivity",
    "Gingivites and gum problem",
    "Missing teeth / tooth replacement",
    "Post filling complaints",
    "Intra oral swelling",
    "General"
  ];

  // Fetch patient email on component mount
  useEffect(() => {
    if (patientId) {
      fetchPatientEmail();
    } else {
      setErrorMessage('Patient ID not found. Please log in again.');
    }
  }, [patientId]);

  // Redirect to dashboard after successful booking
  useEffect(() => {
    let redirectTimer;
    if (bookingConfirmed) {
      redirectTimer = setTimeout(() => {
        navigate('/patient-dashboard');
      }, 5000);
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [bookingConfirmed, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Utility functions
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

  const generateTimeSlots = () => {
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
      
      if (futureDate.getDay() === 0 || futureDate.getDay() === 6) {
        numDays++;
        continue;
      }

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

  // Fetch booked slots for a specific date
  const fetchBookedSlots = async (date) => {
    setFetchingSlots(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/appointment/booked-slots/${date}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        return data.bookedSlots || {};
      } else {
        console.log(data);
        setErrorMessage('Failed to fetch available slots.');
        return {};
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      setErrorMessage('Unable to connect to server. Please try again later.');
      return {};
    } finally {
      setFetchingSlots(false);
    }
  };

  // Event handlers
  const handleComplaintChange = (value) => {
    setChiefComplaint(value);
    setShowGeneralInput(value === 'General');
    if (value !== 'General') {
      setGeneralInput('');
    }
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleShowDates = () => {
    if (!chiefComplaint) {
      setErrorMessage('Please select a chief complaint first!');
      return;
    }
    setErrorMessage('');
    setShowDateSelection(true);
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailableSlots({});
  };

  const handleDateSelection = async (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    
    // Fetch booked slots for the selected date
    const bookedSlots = await fetchBookedSlots(dateStr);
    
    // Generate all possible time slots
    const allSlots = generateTimeSlots();
    const schedule = {};
    
    // Mark slots as available or unavailable based on booking count
    allSlots.forEach((slot) => {
      const bookedCount = bookedSlots[slot.time] || 0;
      schedule[slot.time] = bookedCount < MAX_SLOTS_PER_TIME;
    });

    setAvailableSlots(schedule);
  };

  const handleSlotSelection = (time) => {
    if (availableSlots[time]) { // Only allow selection if slot is available
      setSelectedSlot({ time, date: selectedDate });
    }
  };

  const handleBookingConfirmation = () => {
    if (selectedSlot) {
      setShowConfirmationModal(true);
    }
  };

  // Fetch patient email from backend
  const fetchPatientEmail = async () => {
    setFetchingEmail(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/auth/email-retrieve/${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setPatientEmail(data.email);
      } else {
        setErrorMessage('Failed to load patient information.');
      }
    } catch (error) {
      console.error('Error fetching patient email:', error);
      setErrorMessage('Unable to connect to server. Please try again later.');
    } finally {
      setFetchingEmail(false);
    }
  };

  const proceedBooking = async () => {
    setShowConfirmationModal(false);
    setIsLoading(true);
    
    if (selectedSlot) {
      let finalComplaint = chiefComplaint;
      if (chiefComplaint === 'General') {
        finalComplaint = generalInput.trim() || 'General (No specific details provided)';
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        // API call to save appointment to backend
        const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'/api/appointment/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientId,
            patientEmail,
            chiefComplaint: finalComplaint,
            appointmentDate: selectedSlot.date,
            appointmentTime: selectedSlot.time,
          }),
          signal: abortControllerRef.current.signal,
        });

        const data = await response.json();

        if (data.success) {
          setBookingConfirmed(true);
          setBookingId(data.bookingId);
          setErrorMessage('');
        } else {
          setErrorMessage('Booking failed. Please try again.');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrorMessage('Booking failed. Please try again.');
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const cancelBooking = () => {
    setShowConfirmationModal(false);
  };

  // Get final complaint text for display
  const getFinalComplaint = () => {
    if (chiefComplaint === 'General') {
      return generalInput.trim() || 'General (No specific details provided)';
    }
    return chiefComplaint;
  };

  const upcomingDates = generateUpcomingDates(4);
  const availableTimes = Object.keys(availableSlots).sort((a, b) => {
    const parse = t => {
      let [h, mS] = t.split(':');
      let [m, ap] = mS.split(' ');
      h = parseInt(h);
      m = parseInt(m);
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    return parse(a) - parse(b);
  });

  return (
    <div className='slot-body'>
      <div className="slot-booking-container">
        <h1 className="slot-booking-heading">Book Your Slot</h1>

        {fetchingEmail && (
          <div className="loading-state">
            <p className="loading-text">Loading your information...</p>
          </div>
        )}

        {!fetchingEmail && !bookingConfirmed ? (
          <>
            {/* Patient Information Section */}
            <div className="patient-info-section">
              <p className="patient-info">
                <strong>Patient ID:</strong> {patientId || 'Not available'}
              </p>
              <p className="patient-info">
                <strong>Email:</strong> {patientEmail || 'Not available'}
              </p>
            </div>

            {/* Chief Complaint Section */}
            <div className="complaint-section">
              <label className="complaint-label">Chief Complaint:</label>
              <div className="complaint-options-grid">
                {complaintOptions.map((option) => (
                  <label key={option} className="complaint-option">
                    <input
                      type="radio"
                      name="chiefComplaint"
                      value={option}
                      checked={chiefComplaint === option}
                      onChange={(e) => handleComplaintChange(e.target.value)}
                      className="complaint-radio"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              
              {showGeneralInput && (
                <input
                  type="text"
                  value={generalInput}
                  onChange={(e) => setGeneralInput(e.target.value)}
                  placeholder="e.g., tooth pain, swelling, bleeding gums"
                  className="general-input"
                  maxLength={200}
                />
              )}
            </div>

            {/* Show Dates Button */}
            <button
              onClick={handleShowDates}
              className="show-dates-button"
              disabled={isLoading || !patientEmail}
            >
              {showDateSelection ? "Select Another Date" : "Show Available Dates"}
            </button>

            {/* Error Message */}
            {errorMessage && (
              <div className="error-message">
                <p className="error-title">Error!</p>
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="loading-state">
                <p className="loading-text">Processing...</p>
                <p>Please wait while we book your appointment.</p>
              </div>
            )}

            {/* Fetching Slots State */}
            {fetchingSlots && (
              <div className="loading-state">
                <p className="loading-text">Checking available slots...</p>
              </div>
            )}

            {/* Date Selection */}
            {showDateSelection && !errorMessage && !fetchingSlots && (
              <div className="date-selection-section">
                <p className="date-selection-title">Select a Date:</p>
                <div className="date-grid">
                  {upcomingDates.map((date) => (
                    <div
                      key={date.fullDate}
                      onClick={() => handleDateSelection(date.fullDate)}
                      className={`date-item ${selectedDate === date.fullDate ? 'selected-date' : ''}`}
                    >
                      <span>{date.displayDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Slots */}
            {selectedDate && !fetchingSlots && (
              <div className="time-slots-section">
                <p className="time-slots-title">Available Slots for {selectedDate}:</p>
                {availableTimes.length === 0 ? (
                  <p className="no-slots-message">No available slots for {selectedDate}.</p>
                ) : (
                  <div className="slots-grid">
                    {availableTimes.map((time) => {
                      const isSelected = selectedSlot?.time === time;
                      const isAvailable = availableSlots[time];
                      return (
                        <div
                          key={time}
                          onClick={() => handleSlotSelection(time)}
                          className={`slot-item ${isSelected ? 'selected-slot' : ''} ${
                            !isAvailable ? 'unavailable-slot' : ''
                          }`}
                          title={!isAvailable ? 'This slot is fully booked' : ''}
                        >
                          <span>{time}</span>
                          {!isAvailable && <span className="slot-full-badge">Full</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Book Now Button */}
            {selectedSlot && (
              <button
                onClick={handleBookingConfirmation}
                className="book-now-button"
                disabled={isLoading || !patientEmail}
              >
                {isLoading ? 'Booking...' : 'Book Your Slot'}
              </button>
            )}
          </>
        ) : (
          /* Booking Confirmed */
          !fetchingEmail && (
            <div className="booking-confirmed-section">
              <div className="confirmed-complaint">
                <label className="complaint-label">Chief Complaint:</label>
                <p className="complaint-value">{getFinalComplaint()}</p>
              </div>
              
              <div className="success-message">
                <p className="success-title">✅ Booking Confirmed!</p>
                <p className="booking-details">
                  For: <span className="highlight">{getFinalComplaint()}</span> on{' '}
                  <span className="highlight">{selectedSlot?.date}</span> at{' '}
                  <span className="highlight">{selectedSlot?.time}</span>
                </p>
                <p className="booking-note">
                  A confirmation email has been sent to {patientEmail}. 
                  A doctor will be assigned based on availability.
                </p>
                <p className="booking-id">
                  Booking ID: <span className="highlight">{bookingId}</span>
                </p>
                <p className="redirect-message">
                  You will be redirected to your dashboard in 5 seconds...
                </p>
              </div>
            </div>
          )
        )}

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">Confirm Your Booking</h2>
              <p className="modal-detail">
                Complaint: <span className="modal-highlight">{getFinalComplaint()}</span>
              </p>
              <p className="modal-detail">
                Date: <span className="modal-highlight">{selectedSlot?.date}</span>
              </p>
              <p className="modal-detail">
                Time: <span className="modal-highlight">{selectedSlot?.time}</span>
              </p>
              <p className="modal-detail">
                Email: <span className="modal-highlight">{patientEmail}</span>
              </p>
              <div className="modal-buttons">
                <button
                  onClick={proceedBooking}
                  className="confirm-button"
                  disabled={isLoading || !patientEmail}
                >
                  {isLoading ? 'Confirming...' : 'Yes, Confirm'}
                </button>
                <button
                  onClick={cancelBooking}
                  className="cancel-button"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotBooking;