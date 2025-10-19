// DoctorDashboard.jsx
import React, { useState } from 'react';
import './DoctorDashboard.css'; 
import {useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const DoctorDashboard = () => {
  // State for form data
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    uniqueId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    age: '',
    gender: '',
    maritalStatus: '',
    preferredLanguage: '',
    chiefComplaint: '',
    currentMedications: 'None',
    knownAllergies: 'None',
    chronicConditions: 'None',
    pastSurgeries: 'None',
    pregnancyStatus: '',
    primaryDentalConcerns: 'None',
    lastDentalVisit: '',
    bloodGroup: '',
    drugAllergies: '',
    dietAllergies: ''
  });

  const [showForm, setShowForm] = useState(false);
  const [showUserIdDisplay, setShowUserIdDisplay] = useState(false);
  const [generatedUserId, setGeneratedUserId] = useState('');
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hpiSelections, setHpiSelections] = useState([]);
  const [pastMedicalHistory, setPastMedicalHistory] = useState([]);
  const [personalHabits, setPersonalHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Options for form fields
  const hpiOptions = ["Diabetes", "Hypertension", "Asthma", "Hyperlipidemia", "Thyroid"];
  const pastMedicalHistoryOptions = ["Diabetes", "Hypertension", "Osteoporosis", "Arthritis", "Heart Disease"];
  const personalHabitsOptions = ["Smoking", "Alcohol", "Betel Nut"];
  const chiefComplaints = [
    "Pain/Toothache", "Dental Caries (Cavities)", "Sensitivity",
    "Gingivitis and Gum Problems", "Aesthetic Concerns", "Post-filling Complaints",
    "Missing Teeth/Tooth Replacement", "Routine Check-up/Cleaning", "Oral Ulcers",
    "Facial/Intra-oral Swelling", "Loose Teeth", "Bad Breath (Halitosis)",
    "Temporomandibular Joint (TMJ) Pain/Disorder", "Fractured Tooth", "Food Impaction"
  ];

  // Helper functions
  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleLogout = () => {
    logout(); 
  };

  const showMessage = (msg, type = 'error') => {
    if (type === 'error') {
      setMessage(msg);
      setSuccessMessage('');
    } else {
      setSuccessMessage(msg);
      setMessage('');
    }
    setTimeout(() => {
      setMessage('');
      setSuccessMessage('');
    }, 5000);
  };

  const populateFormWithPatientData = (patientData) => {
    setFormData({
      ...formData,
      firstName: patientData.personalInfo?.firstName || '',
      middleName: patientData.personalInfo?.middleName || '',
      lastName: patientData.personalInfo?.lastName || '',
      dob: patientData.personalInfo?.dateOfBirth ? new Date(patientData.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
      age: patientData.personalInfo?.age || '',
      gender: patientData.personalInfo?.gender || '',
      maritalStatus: patientData.personalInfo?.maritalStatus || '',
      preferredLanguage: patientData.personalInfo?.preferredLanguage || '',
      chiefComplaint: patientData.medicalInfo?.chiefComplaint || '',
      currentMedications: patientData.medicalInfo?.currentMedications?.join(', ') || 'None',
      knownAllergies: patientData.medicalInfo?.knownAllergies?.join(', ') || 'None',
      chronicConditions: patientData.medicalInfo?.chronicConditions?.join(', ') || 'None',
      pastSurgeries: patientData.medicalInfo?.pastSurgeries?.join(', ') || 'None',
      pregnancyStatus: patientData.medicalInfo?.pregnancyStatus || '',
      primaryDentalConcerns: patientData.medicalInfo?.dentalConcerns?.join(', ') || 'None',
      lastDentalVisit: patientData.medicalInfo?.lastDentalVisit ? new Date(patientData.medicalInfo.lastDentalVisit).toISOString().split('T')[0] : '',
      bloodGroup: patientData.vitals?.bloodGroup || '',
      drugAllergies: patientData.vitals?.drugAllergies?.join(', ') || '',
      dietAllergies: patientData.vitals?.dietAllergies?.join(', ') || ''
    });

    setHpiSelections(patientData.medicalInfo?.hpi || []);
    setPastMedicalHistory(patientData.medicalInfo?.pastMedicalHistory || []);
    setPersonalHabits(patientData.medicalInfo?.personalHabits || []);
  };
  //validate
  const validateForm = () => {
  const requiredFields = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    dob: formData.dob.trim(),
    gender: formData.gender.trim(),
    maritalStatus: formData.maritalStatus.trim(),
    chiefComplaint: formData.chiefComplaint.trim(),
    pregnancyStatus: formData.pregnancyStatus.trim(),
    bloodGroup: formData.bloodGroup.trim(),
    preferredLanguage: formData.preferredLanguage.trim(),
  };

  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value) {
      showMessage(`Please fill the required field: ${field}`, "error");
      return false;
    }
  }
  return true;
};

  // FIXED handleGetDetails function
  const handleGetDetails = async () => {
    const enteredId = formData.uniqueId.trim();
    
    try {
      setIsLoading(true);
      
      if (enteredId) {
        // Search for existing patient
        const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/doctor-patient/${enteredId}`);
        
        if (response.ok) {
          const result = await response.json();
          const patientData = result.data;
          populateFormWithPatientData(patientData);
          setGeneratedUserId(patientData.patientId);
          showMessage(`Patient details loaded for ID: ${patientData.patientId}`, 'success');
        } else if (response.status === 404) {
          showMessage('Patient not found. This appears to be a new patient.', 'error');
          setGeneratedUserId(enteredId);
        } else {
          throw new Error('Failed to fetch patient data');
        }
      } else {
        // Generate new patient ID that does not exist in DB
        let newId = '';
        let exists = true;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (exists && attempts < maxAttempts) {
          newId = 'U' + Math.floor(1000 + Math.random() * 9000);
          try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/doctor-patient/check-id/${newId}`);
            if (res.ok) {
              const data = await res.json();
              exists = data.exists;
            }
          } catch (err) {
            // Assume ID is available if check fails
            exists = false; 
          }
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          showMessage('Failed to generate unique ID. Please try again.', 'error');
          return;
        }
        
        setGeneratedUserId(newId);
        // Reset form for new patient
        setFormData({
          ...formData,
          firstName: '',
          middleName: '',
          lastName: '',
          dob: '',
          age: '',
          gender: '',
          maritalStatus: '',
          preferredLanguage: '',
          chiefComplaint: '',
          currentMedications: 'None',
          knownAllergies: 'None',
          chronicConditions: 'None',
          pastSurgeries: 'None',
          pregnancyStatus: '',
          primaryDentalConcerns: 'None',
          lastDentalVisit: '',
          bloodGroup: '',
          drugAllergies: '',
          dietAllergies: ''
        });
        setHpiSelections([]);
        setPastMedicalHistory([]);
        setPersonalHabits([]);
        showMessage(`New patient ID generated: ${newId}`, 'success');
      }
      
      setShowUserIdDisplay(true);
      setShowForm(true);
    } catch (error) {
      showMessage(error.message || 'An error occurred while fetching patient data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'hpi') {
        setHpiSelections(prev => 
          checked ? [...prev, value] : prev.filter(item => item !== value)
        );
      } else if (name === 'past-medical-history') {
        setPastMedicalHistory(prev => 
          checked ? [...prev, value] : prev.filter(item => item !== value)
        );
      } else if (name === 'personal-habits') {
        setPersonalHabits(prev => 
          checked ? [...prev, value] : prev.filter(item => item !== value)
        );
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Auto-calculate age when DOB changes
      if (name === 'dob' && value) {
        const age = calculateAge(value);
        setFormData(prev => ({
          ...prev,
          age: age
        }));
      }
    }
  };

  // FIXED handleSavePatient function
  const handleSavePatient = async () => {
    if (!validateForm()) return;
    try {
      setIsLoading(true);
      
      // Prepare the data in the format your backend expects
      const patientData = {
        patientId: generatedUserId,
        personalInfo: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          dateOfBirth: formData.dob,
          age: parseInt(formData.age) || 0,
          gender: formData.gender,
          maritalStatus: formData.maritalStatus,
          preferredLanguage: formData.preferredLanguage
        },
        medicalInfo: {
          chiefComplaint: formData.chiefComplaint,
          hpi: hpiSelections,
          pastMedicalHistory: pastMedicalHistory,
          personalHabits: personalHabits,
          currentMedications: formData.currentMedications.split(',').map(item => item.trim()).filter(item => item && item !== 'None'),
          knownAllergies: formData.knownAllergies.split(',').map(item => item.trim()).filter(item => item && item !== 'None'),
          chronicConditions: formData.chronicConditions.split(',').map(item => item.trim()).filter(item => item && item !== 'None'),
          pastSurgeries: formData.pastSurgeries.split(',').map(item => item.trim()).filter(item => item && item !== 'None'),
          pregnancyStatus: formData.pregnancyStatus,
          dentalConcerns: formData.primaryDentalConcerns.split(',').map(item => item.trim()).filter(item => item && item !== 'None'),
          lastDentalVisit: formData.lastDentalVisit || null
        },
        vitals: {
          bloodGroup: formData.bloodGroup,
          drugAllergies: formData.drugAllergies.split(',').map(item => item.trim()).filter(item => item),
          dietAllergies: formData.dietAllergies.split(',').map(item => item.trim()).filter(item => item)
        }
      };

      // Send data to backend
     const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'/api/doctor-patient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData)
    });

    if (response.ok) {
      const result = await response.json();
      const id = result.patientId;
      const name = result.patientName;
      localStorage.setItem('CurrentpatientName', name);
      localStorage.setItem('CurrentpatientId', id);
      showMessage('Patient details saved successfully!', 'success');
      console.log('Patient data from localStorage:', {
});
    } else {
      const error = await response.json();
      showMessage(`Error saving patient: ${error.message}`, 'error');
    }
  } catch (error) {
    showMessage('Error saving patient: ' + error.message, 'error');
  } finally {
    setIsLoading(false);
  }
};

  const handleNavigation = (url) => {
    // In a real app, you would use React Router
    console.log('Navigating to:', url);
  };

  return (
    <div className="doctor-dashboard-container">
      <div className="doctor-dashboard-content">
        {/* Header with user icon */}
        <div className="dashboard-header">
          <div className="user-icon-container">
            <div className="user-icon" onClick={() => navigate('/doctor-schedule')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
          <span className="appointment-confirmation">Appointment Confirmation</span>
        </div>
        <button onClick={handleLogout} className="logout-btn-doctor">
          Logout
       </button>
        {/* Logo */}
        <div className="logo-box-user">
          <img src="/images/logo.png" alt="SRM Dental College Logo" className="logo-img-user" onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = 'https://placehold.co/100x40/25286b/ffffff?text=SRM+Dental'; 
            }} />
          </div>
          <div className="doctor-info-1">
          <h2 className="doctor-info-name">
            Dr. {user?.name || "Doctor"}
          </h2>
          <h6 className="doctor-info-id">
            Doctor ID: {user?.id || "N/A"}
          </h6>
        </div>
          <h2 className="dashboard-title">Patient Details</h2>

          {/* Message boxes */}
        {message && (
          <div className="error-message">
            {message}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {/* Unique ID input */}
        <div className="input-group">
          <label htmlFor="unique-id">
            Enter Existing Unique Patient ID (Optional)
          </label>
          <input
            type="text"
            id="unique-id"
            name="uniqueId"
            value={formData.uniqueId}
            onChange={handleInputChange}
            placeholder="e.g., U0001 or leave blank for new patient"
          />
        </div>

        {/* Radio button */}
        <div className="radio-group">
          <input
            type="radio"
            id="give-details-radio"
            name="details-option"
            checked
            readOnly
          />
          <label htmlFor="give-details-radio">
            Auto-fill Patient Details
          </label>
        </div>

        {/* Get Details Button */}
        <button
          className="get-details-btn"
          onClick={handleGetDetails}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Get / Generate Patient Details'}
        </button>

        {/* Generated User ID Display */}
        {showUserIdDisplay && (
          <div className="patient-id-display">
            <p>
              Current Patient ID: <span>{generatedUserId}</span>
            </p>
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <div className="patient-form">
            <h3>Personal Information</h3>

            {/* Name fields */}
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="first-name">
                  First Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  id="first-name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="middle-name">
                  Middle Name
                </label>
                <input
                  type="text"
                  id="middle-name"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="last-name">
                Last Name <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                id="last-name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* DOB and Age */}
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="dob">
                  Date of Birth <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="age">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  readOnly
                />
              </div>
            </div>

            {/* Gender */}
            <div className="input-group">
              <label>
                Gender <span style={{ color: "red" }}>*</span>
              </label>
              <div className="radio-options">
                {['Male', 'Female', 'Other'].map((gender) => (
                  <label key={gender} className="radio-option">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={handleInputChange}
                    />
                    <span>{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Marital Status */}
            <div className="input-group">
              <label>
                Marital Status <span style={{ color: "red" }}>*</span>
              </label>
              <div className="radio-options">
                {['Single', 'Married', 'Other'].map((status) => (
                  <label key={status} className="radio-option">
                    <input
                      type="radio"
                      name="maritalStatus"
                      value={status}
                      checked={formData.maritalStatus === status}
                      onChange={handleInputChange}
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferred Language */}
            <div className="input-group">
              <label htmlFor="preferred-language">
                Preferred Language
              </label>
              <select
                id="preferred-language"
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>

            {/* Patient Case Entry Section */}
            <h3>Patient Case Entry - Chief Complaint & History</h3>

            {/* Chief Complaint */}
            <div className="input-group">
              <label htmlFor="chief-complaint">
                Chief Complaint
              </label>
              <select
                id="chief-complaint"
                name="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={handleInputChange}
              >
                <option value="">Select a primary issue</option>
                {chiefComplaints.map((complaint) => (
                  <option key={complaint} value={complaint}>{complaint}</option>
                ))}
              </select>
            </div>

            {/* HPI Checkboxes */}
            <div className="input-group">
              <label>
                History of Present Illness (HPI) - Select all that apply
              </label>
              <div className="checkbox-options">
                {hpiOptions.map((option) => (
                  <label key={option} className="checkbox-option">
                    <input
                      type="checkbox"
                      name="hpi"
                      value={option}
                      checked={hpiSelections.includes(option)}
                      onChange={handleInputChange}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Past Medical History Checkboxes */}
            <div className="input-group">
              <label>
                Past Medical History - Select all that apply
              </label>
              <div className="checkbox-options">
                {pastMedicalHistoryOptions.map((option) => (
                  <label key={option} className="checkbox-option">
                    <input
                      type="checkbox"
                      name="past-medical-history"
                      value={option}
                      checked={pastMedicalHistory.includes(option)}
                      onChange={handleInputChange}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Personal Habits Checkboxes */}
            <div className="input-group">
              <label>
                Personal Habits - Select all that apply
              </label>
              <div className="checkbox-options">
                {personalHabitsOptions.map((option) => (
                  <label key={option} className="checkbox-option">
                    <input
                      type="checkbox"
                      name="personal-habits"
                      value={option}
                      checked={personalHabits.includes(option)}
                      onChange={handleInputChange}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Text areas for additional information */}
            <div className="input-group">
              <h3>Medical history</h3>
              <label htmlFor="current-medications">
                Current Medications
              </label>
              <textarea
                id="current-medications"
                name="currentMedications"
                value={formData.currentMedications}
                onChange={handleInputChange}
                rows="2"
              />
            </div>

            <div className="input-group">
              <label htmlFor="known-allergies">
                Known Allergies (e.g., latex, medications, anesthetics)
              </label>
              <textarea
                id="known-allergies"
                name="knownAllergies"
                value={formData.knownAllergies}
                onChange={handleInputChange}
                rows="2"
              />
            </div>

            <div className="input-group">
              <label htmlFor="chronic-conditions">
                Chronic Conditions (e.g., diabetes, heart disease)
              </label>
              <textarea
                id="chronic-conditions"
                name="chronicConditions"
                value={formData.chronicConditions}
                onChange={handleInputChange}
                rows="2"
              />
            </div>

            <div className="input-group">
              <label htmlFor="past-surgeries">
                Past Surgeries
              </label>
              <textarea
                id="past-surgeries"
                name="pastSurgeries"
                value={formData.pastSurgeries}
                onChange={handleInputChange}
                rows="2"
              />
            </div>

            {/* Pregnancy Status */}
            <div className="input-group">
              <label>
                Pregnancy Status (if applicable)
              </label>
              <div className="radio-options">
                {['No', 'Yes', 'N/A'].map((status) => (
                  <label key={status} className="radio-option">
                    <input
                      type="radio"
                      name="pregnancyStatus"
                      value={status}
                      checked={formData.pregnancyStatus === status}
                      onChange={handleInputChange}
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="primary-dental-concerns">
                Primary Dental Concerns (e.g., pain, sensitivity, bleeding gums)
              </label>
              <textarea
                id="primary-dental-concerns"
                name="primaryDentalConcerns"
                value={formData.primaryDentalConcerns}
                onChange={handleInputChange}
                rows="2"
              />
            </div>

            <div className="input-group">
              <label htmlFor="last-dental-visit">
                Date of Last Dental Visit
              </label>
              <input
                type="date"
                id="last-dental-visit"
                name="lastDentalVisit"
                value={formData.lastDentalVisit}
                onChange={handleInputChange}
              />
            </div>

            {/* Vitals Section */}
            <h3>Other Information</h3>
            
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="blood-group">Blood Group</label>
                <input
                  type="text"
                  id="blood-group"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  placeholder="e.g., O+"
                />
              </div>
              <div className="input-group">
                <label htmlFor="drug-allergies">Drug Allergies</label>
                <input
                  type="text"
                  id="drug-allergies"
                  name="drugAllergies"
                  value={formData.drugAllergies}
                  onChange={handleInputChange}
                  placeholder="Specify drug allergies"
                />
              </div>
              <div className="input-group">
                <label htmlFor="diet-allergies">Diet Allergies</label>
                <input
                  type="text"
                  id="diet-allergies"
                  name="dietAllergies"
                  value={formData.dietAllergies}
                  onChange={handleInputChange}
                  placeholder="Specify diet allergies"
                />
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="form-actions">
              <button
                className="save-btn"
                onClick={handleSavePatient}
                disabled={isLoading}
              >
                {isLoading ? '...Saved...' : 'Save Patient Details'}
              </button>
              <button
                className="case-files-btn"
                onClick={() => navigate('/casePortal')}
                type="button"
              >
                Go to Case Files
              </button>
              <button
                className="case-history-btn"
                onClick={() => navigate('/case-history')}
                type="button"
              >
                Case History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;