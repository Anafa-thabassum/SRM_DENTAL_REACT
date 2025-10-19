// prescription.jsx
import React, { useState, useEffect } from 'react';
import './prescription.css';

const Prescription = () => {
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalCallback, setModalCallback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [doctorInfo, setDoctorInfo] = useState({
    id: '',
    name: ''
  });

  useEffect(() => {
    // Check if this is for a logged-in patient (patient dashboard) or doctor creating prescription
    const loggedInPatientId = localStorage.getItem('patientId');
    const loggedInPatientName = localStorage.getItem('patientName');
    const currentPatientId = localStorage.getItem('CurrentpatientId');
    const currentPatientName = localStorage.getItem('CurrentpatientName');

    if (loggedInPatientId && loggedInPatientName) {
      // Patient is logged in - fetch their details
      setPatientId(loggedInPatientId);
      setPatientData(prev => ({
        ...prev,
        name: loggedInPatientName
      }));

      // Fetch complete patient details for logged-in patient
      fetchPatientDetailsByPatientId(loggedInPatientId);
    } else if (currentPatientId && currentPatientName) {
      // Doctor selected a patient - use the current patient data
      setPatientId(currentPatientId);
      setPatientData(prev => ({
        ...prev,
        name: currentPatientName
      }));

      // Fetch complete patient details
      fetchPatientDetails(currentPatientId);
    }

    // Get doctor info (you might want to get this from auth context)
    const doctorData = JSON.parse(localStorage.getItem('doctorData') || '{}');
    setDoctorInfo({
      id: doctorData.id || 'DOC001',
      name: doctorData.name || 'Dr. Smith'
    });
  }, []);

  const fetchPatientDetails = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/doctor-patient/${id}`);
      if (response.ok) {
        const result = await response.json();
        const patient = result.data;

        setPatientData(prev => ({
          ...prev,
          name: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
          age: patient.personalInfo.age.toString(),
          gender: patient.personalInfo.gender
        }));
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const fetchPatientDetailsByPatientId = async (patientId) => {
    try {
      // First, try to fetch patient details using the patientId from PatientDetails collection
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/patient-details/by-patient-id/${patientId}`);

      if (response.ok) {
        const result = await response.json();
        const patient = result.data;

        setPatientData(prev => ({
          ...prev,
          name: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
          age: patient.personalInfo.age.toString(),
          gender: patient.personalInfo.gender.toLowerCase()
        }));
      } else {
        // If not found in PatientDetails, keep the name from localStorage
        console.log('Patient details not found in database, using localStorage data');
      }
    } catch (error) {
      console.error('Error fetching patient details by patient ID:', error);
      // Keep using the name from localStorage if API fails
    }
  };

  const handleBackToDashboard = () => {
    // Check if it's a patient or doctor and redirect accordingly
    const loggedInPatientId = localStorage.getItem('patientId');

    if (loggedInPatientId) {
      // Patient is logged in - go to patient dashboard
      window.location.href = '/patient-dashboard';
    } else {
      // Doctor is logged in - go to doctor dashboard
      window.location.href = '/doctor-dashboard';
    }
  };

  const addMedicineRow = () => {
    const newMedicine = {
      id: Date.now(),
      type: '',
      name: '',
      dosage: { m: '0', n: '0', e: '0', n2: '0' },
      foodIntake: 'after',
      duration: '',
      durationType: 'days', // New field to track duration type
      asNeeded: false
    };

    setMedicines([...medicines, newMedicine]);
  };

  const removeMedicineRow = (id) => {
    showConfirmationModal('Are you sure you want to remove this medicine?', () => {
      setMedicines(medicines.filter(medicine => medicine.id !== id));
    });
  };

  const updateMedicine = (id, field, value) => {
    setMedicines(medicines.map(medicine => {
      if (medicine.id === id) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return {
            ...medicine,
            [parent]: {
              ...medicine[parent],
              [child]: value
            }
          };
        }

        // Special handling for injection type changes
        if (field === 'type' && value === 'injection') {
          return {
            ...medicine,
            [field]: value,
            durationType: 'everyVisit',
            duration: 'Every Visit',
            dosage: { m: '1', n: '0', e: '0', n2: '0' }, // Single dose for injections
            foodIntake: 'after' // Default for injections
          };
        } else if (field === 'type' && medicine.type === 'injection' && value !== 'injection') {
          // Reset to normal values when changing from injection to other types
          return {
            ...medicine,
            [field]: value,
            durationType: 'days',
            duration: '',
            dosage: { m: '0', n: '0', e: '0', n2: '0' },
            foodIntake: 'after'
          };
        }

        return { ...medicine, [field]: value };
      }
      return medicine;
    }));
  };

  const showConfirmationModal = (message, onConfirm) => {
    setModalMessage(message);
    setModalCallback(() => onConfirm);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (modalCallback) modalCallback();
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!patientId) {
      alert('Patient ID is required. Please go back to patient selection.');
      return;
    }

    if (!symptoms.trim()) {
      alert('Symptoms are required.');
      return;
    }

    if (!diagnosis.trim()) {
      alert('Diagnosis is required.');
      return;
    }

    if (medicines.length === 0) {
      alert('Please add at least one medicine.');
      return;
    }

    // Validate medicines
    for (const medicine of medicines) {
      if (!medicine.asNeeded) {
        if (!medicine.type || !medicine.name) {
          alert('Please fill all medicine details (Type, Name).');
          return;
        }
        // For non-injection types, duration is still required
        if (medicine.type !== 'injection' && !medicine.duration) {
          alert('Please fill duration for all non-injection medicines.');
          return;
        }
      }
    }

    setLoading(true);

    try {
      // Prepare prescription data
      const prescriptionData = {
        patientId: patientId,
        patientData: patientData,
        symptoms: symptoms,
        diagnosis: diagnosis,
        medicines: medicines.map(med => ({
          type: med.type,
          name: med.name,
          dosage: med.dosage,
          foodIntake: med.foodIntake,
          duration: med.type === 'injection' ? 1 : (parseInt(med.duration) || 0),
          durationType: med.type === 'injection' ? 'everyVisit' : 'days',
          asNeeded: med.asNeeded
        })),
        advice: advice,
        nextVisitDate: nextVisitDate || null,
        doctorId: doctorInfo.id,
        doctorName: doctorInfo.name
      };

      console.log('Sending prescription data:', prescriptionData);

      const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prescriptionData)
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (response.ok) {
        try {
          const result = JSON.parse(responseText);
          alert('Prescription saved successfully!');

          // Store prescription ID for later use
          localStorage.setItem('lastPrescriptionId', result.data._id);

          // Reset form if needed
          // resetForm();
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          alert('Prescription may have been saved but there was an issue with the response.');
        }
      } else {
        console.error('Response not OK:', response.status, responseText);
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.message || 'Failed to save prescription');
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} - ${responseText}`);
        }
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Error saving prescription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientDataChange = (field, value) => {
    setPatientData({
      ...patientData,
      [field]: value
    });
  };

  const printPrescription = () => {
    window.print();
  };

  return (
    <div className="prescription-container">
      <div className="prescription-form">
        {/* Back to Dashboard Button */}
        <button
          onClick={handleBackToDashboard}
          className="dashboard-back"
          type="button"
        >
          ← Back to Dashboard
        </button>

        <div className="logo-container">
          <img
            src="/images/logo.png"
            alt="Dental Clinic Logo"
            className="logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/100x40/25286b/ffffff?text=SRM+Dental';
            }}
          />

          <h2 className="clinic-name">SRM Dental College</h2>
          <p className="prescription-label">Prescription</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Patient Name:</label>
              <input
                type="text"
                value={patientData.name}
                onChange={(e) => handlePatientDataChange('name', e.target.value)}
                className="form-input"
                required
                readOnly={!!localStorage.getItem('patientId')} // Make readonly if patient is logged in
              />
            </div>
            <div className="form-field">
              <label className="form-label">Age:</label>
              <input
                type="number"
                value={patientData.age}
                onChange={(e) => handlePatientDataChange('age', e.target.value)}
                className="form-input"
                min="0"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Gender:</label>
              <select
                value={patientData.gender}
                onChange={(e) => handlePatientDataChange('gender', e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Date:</label>
              <input
                type="date"
                value={patientData.date}
                onChange={(e) => handlePatientDataChange('date', e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Symptoms:</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="form-textarea"
              rows="2"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Diagnosis:</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="form-textarea"
              rows="2"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Prescribed Medicines:</label>
            <div className="medicine-table-wrapper">
              <table className="medicine-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Type</th>
                    <th>Medicine Name</th>
                    <th>Dosage (M-N-E-N)</th>
                    <th>Food</th>
                    <th>Duration</th>
                    <th>As Needed</th>
                    <th>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((medicine, index) => (
                    <MedicineRow
                      key={medicine.id}
                      index={index}
                      medicine={medicine}
                      updateMedicine={updateMedicine}
                      removeMedicine={removeMedicineRow}
                    />
                  ))}
                  {medicines.length === 0 && (
                    <tr className="no-medicines">
                      <td colSpan="8" className="text-center">
                        No medicines added. Click "Add Medicine" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addMedicineRow}
              className="add-medicine-btn"
            >
              Add Medicine
            </button>
          </div>

          <div className="form-field">
            <label className="form-label">Advice:</label>
            <textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="form-textarea"
              rows="2"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Next Visit Date:</label>
            <input
              type="date"
              value={nextVisitDate}
              onChange={(e) => setNextVisitDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className={loading ? "submit-btn disabled" : "submit-btn"}
            >
              {loading ? 'Saving...' : 'Save Prescription'}
            </button>
            <button
              type="button"
              onClick={printPrescription}
              className="print-btn"
            >
              Print Prescription
            </button>
          </div>
        </form>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p>{modalMessage}</p>
            <div className="modal-actions">
              <button onClick={handleConfirm} className="modal-confirm-btn">
                Yes
              </button>
              <button onClick={handleCancel} className="modal-cancel-btn">
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MedicineRow = ({ index, medicine, updateMedicine, removeMedicine }) => {
  const handleDosageChange = (time, value) => {
    updateMedicine(medicine.id, `dosage.${time}`, value);
  };

  const handleInputChange = (field, value) => {
    updateMedicine(medicine.id, field, value);
  };

  const isInjection = medicine.type === 'injection';

  return (
    <tr className="medicine-row">
      <td className="serial-cell">{index + 1}</td>
      <td className="type-cell">
        <select
          value={medicine.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          className="medicine-type"
          disabled={medicine.asNeeded}
          required
        >
          <option value="">Select Type</option>
          <option value="injection">Injection</option>
          <option value="syrup">Syrup</option>
          <option value="pills">Pills</option>
          <option value="ointment">Ointment</option>
        </select>
      </td>
      <td className="name-cell">
        <input
          type="text"
          value={medicine.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="medicine-name"
          placeholder="Medicine Name"
          disabled={medicine.asNeeded}
          required
        />
      </td>
      <td className="dosage-cell">
        <div className="dosage-container">
          <div className="dosage-item">
            <select
              value={medicine.dosage.m}
              onChange={(e) => handleDosageChange('m', e.target.value)}
              className="dosage-input"
              disabled={medicine.asNeeded || isInjection}
            >
              <option value="0">0</option>
              <option value="1/4">1/4</option>
              <option value="1/2">1/2</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
          <span className="dosage-separator">-</span>
          <div className="dosage-item">
            <select
              value={medicine.dosage.n}
              onChange={(e) => handleDosageChange('n', e.target.value)}
              className="dosage-input"
              disabled={medicine.asNeeded || isInjection}
            >
              <option value="0">0</option>
              <option value="1/4">1/4</option>
              <option value="1/2">1/2</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
          <span className="dosage-separator">-</span>
          <div className="dosage-item">
            <select
              value={medicine.dosage.e}
              onChange={(e) => handleDosageChange('e', e.target.value)}
              className="dosage-input"
              disabled={medicine.asNeeded || isInjection}
            >
              <option value="0">0</option>
              <option value="1/4">1/4</option>
              <option value="1/2">1/2</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
          <span className="dosage-separator">-</span>
          <div className="dosage-item">
            <select
              value={medicine.dosage.n2}
              onChange={(e) => handleDosageChange('n2', e.target.value)}
              className="dosage-input"
              disabled={medicine.asNeeded || isInjection}
            >
              <option value="0">0</option>
              <option value="1/4">1/4</option>
              <option value="1/2">1/2</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
        </div>
      </td>
      <td className="food-cell">
        <select
          value={medicine.foodIntake}
          onChange={(e) => handleInputChange('foodIntake', e.target.value)}
          className="food-intake-select"
          disabled={medicine.asNeeded || isInjection}
        >
          <option value="after">AF</option>
          <option value="before">BF</option>
        </select>
      </td>
      <td className="duration-cell">
        {isInjection ? (
          <span className="injection-duration">Every Visit</span>
        ) : (
          <div className="duration-group">
            <input
              type="number"
              min="0"
              value={medicine.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              className="duration-input"
              placeholder="Days"
              disabled={medicine.asNeeded}
            />
          </div>
        )}
      </td>
      <td className="as-needed-cell">
        <input
          type="checkbox"
          checked={medicine.asNeeded}
          onChange={(e) => handleInputChange('asNeeded', e.target.checked)}
          className="as-needed-checkbox"
          disabled={isInjection}
        />
      </td>
      <td className="remove-cell">
        <button
          type="button"
          onClick={() => removeMedicine(medicine.id)}
          className="remove-btn"
          title="Remove medicine"
        >
          ×
        </button>
      </td>
    </tr>
  );
};

export default Prescription;