import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  // State management
    const navigate = useNavigate();
    const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('patientManagement');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPatient, setNewPatient] = useState({
    patientId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: ''
  });
  const [billingRecords, setBillingRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPatientId, setGeneratingPatientId] = useState(false);

  // New state for edit functionality
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPatientData, setEditPatientData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);

  // Fetch data from backend on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-generate patient ID when component mounts or when explicitly requested
  useEffect(() => {
    if (patients.length > 0 && !newPatient.patientId) {
      generateUniquePatientId();
    }
  }, [patients]);

  const handleLogout = () => {
    logout(); 
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use absolute URL for development
      const API_BASE = import.meta.env.VITE_BACKEND_SERVER+'';

      console.log('Fetching patients from API...');

      // First check if the API is reachable
      try {
        const testResponse = await fetch(`${API_BASE}/api/test`);
        const testData = await testResponse.json();
        console.log('Test API response:', testData);
      } catch (testError) {
        console.warn('Test API not available:', testError.message);
        throw new Error('Backend server is not responding. Please make sure the server is running on port 5000.');
      }

      // Fetch patients from the correct API endpoint
      const patientsResponse = await fetch(`${API_BASE}/api/patient-details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Patients API response status:', patientsResponse.status);

      // Check if response is HTML (error page)
      const contentType = patientsResponse.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const htmlResponse = await patientsResponse.text();
        console.error('Received HTML instead of JSON:', htmlResponse.substring(0, 200));
        throw new Error('Server returned HTML page instead of JSON data. Check if API endpoint exists.');
      }

      if (!patientsResponse.ok) {
        const errorText = await patientsResponse.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch patients: ${patientsResponse.status} - ${errorText}`);
      }

      // Try to parse JSON response
      const patientsData = await patientsResponse.json();
      console.log('Patients API response data:', patientsData);

      // Handle different response structures
      let patientsList = [];
      if (patientsData.success && patientsData.patients) {
        patientsList = patientsData.patients;
      } else if (patientsData.success && patientsData.data) {
        patientsList = patientsData.data;
      } else if (Array.isArray(patientsData)) {
        patientsList = patientsData;
      } else {
        console.warn('Unexpected API response structure:', patientsData);
        patientsList = [];
      }

      setPatients(Array.isArray(patientsList) ? patientsList : []);
      console.log(`Successfully loaded ${patientsList.length} patients`);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);

      // Show mock data for development
      const mockPatients = [
        {
          _id: '1',
          patientId: 'P001',
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '9876543210',
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            address: '123 Main St, City, State'
          },
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          patientId: 'P002',
          personalInfo: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '9876543211',
            dateOfBirth: '1985-05-15',
            gender: 'Female',
            address: '456 Oak St, City, State'
          },
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];

      setPatients(mockPatients);
      console.log('Using mock data due to API error');
    } finally {
      setLoading(false);
    }
  };

  // Generate unique random patient ID starting with U and 4 digits (e.g., U4821)
  const generateUniquePatientId = async () => {
    try {
      setGeneratingPatientId(true);

      const existingIds = new Set(patients.map(p => p.patientId));

      let newPatientId = '';

      // Keep generating until a unique ID is found
      do {
        // U + 4 random digits, always 0000–9999 (padded to 4 digits)
        const randomDigits = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0');
        newPatientId = `U${randomDigits}`;
      } while (existingIds.has(newPatientId));

      // Update the form with the new patient ID
      setNewPatient(prev => ({
        ...prev,
        patientId: newPatientId
      }));

      console.log(`Generated unique patient ID: ${newPatientId}`);
    } catch (err) {
      console.error('Error generating patient ID:', err);
      // Fallback: still U + 4 digits
      const fallbackId = `U${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`;
      setNewPatient(prev => ({ ...prev, patientId: fallbackId }));
    } finally {
      setGeneratingPatientId(false);
    }
  };

  // Handle generate new patient ID button click
  const handleGeneratePatientId = () => {
    generateUniquePatientId();
  };

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.personalInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.personalInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.personalInfo?.phone?.includes(searchTerm)
  );

  // Handle search and auto-populate if patient exists
  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);

    // Only check against local patients data, no API calls
    if (searchValue.trim()) {
      const matchedPatient = patients.find(p =>
        p.patientId.toLowerCase() === searchValue.toLowerCase()
      );

      if (matchedPatient) {
        // Auto-populate the form with existing patient data
        setNewPatient({
          patientId: matchedPatient.patientId,
          firstName: matchedPatient.personalInfo?.firstName || '',
          lastName: matchedPatient.personalInfo?.lastName || '',
          email: matchedPatient.personalInfo?.email || '',
          phone: matchedPatient.personalInfo?.phone || '',
          dob: matchedPatient.personalInfo?.dateOfBirth ?
            new Date(matchedPatient.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
          gender: matchedPatient.personalInfo?.gender || '',
          address: matchedPatient.personalInfo?.address || ''
        });

        // Also select the patient in the details view
        setSelectedPatient(matchedPatient);

        console.log('Auto-populated form with existing patient:', matchedPatient.patientId);
      }
    }
  };

  // Clear form and generate new patient ID
  const handleClearForm = () => {
    setNewPatient({
      patientId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      address: ''
    });
    setSearchTerm('');
    generateUniquePatientId();
  };

  // Handle patient selection
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setIsEditMode(false); // Reset edit mode when selecting a new patient
    console.log('Selected patient:', patient);

    try {
      // Try to get patient's billing records (if endpoint exists)
      try {
        const billingResponse = await fetch(`/api/billing/${patient.patientId}`);
        if (billingResponse.ok) {
          const patientBilling = await billingResponse.json();
          setBillingRecords(prev => [...prev.filter(r => r.patientId !== patient.patientId), ...patientBilling]);
        }
      } catch (billingError) {
        console.log('Billing endpoint not available:', billingError.message);
      }

      // Try to get patient's prescriptions
      try {
        const prescriptionsResponse = await fetch(`/api/prescriptions/patient/${patient.patientId}`);
        if (prescriptionsResponse.ok) {
          const patientPrescriptions = await prescriptionsResponse.json();
          setPrescriptions(prev => [...prev.filter(p => p.patientId !== patient.patientId), ...patientPrescriptions]);
        }
      } catch (prescError) {
        console.log('Prescriptions endpoint not fully available:', prescError.message);
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
    }
  };

  // Handle entering edit mode
  const handleEditPatient = () => {
    if (!selectedPatient) return;

    setIsEditMode(true);
    setEditPatientData({
      firstName: selectedPatient.personalInfo?.firstName || '',
      lastName: selectedPatient.personalInfo?.lastName || '',
      email: selectedPatient.personalInfo?.email || '',
      phone: selectedPatient.personalInfo?.phone || '',
      dateOfBirth: selectedPatient.personalInfo?.dateOfBirth ?
        new Date(selectedPatient.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
      gender: selectedPatient.personalInfo?.gender || '',
      address: selectedPatient.personalInfo?.address || ''
    });
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditPatientData({});
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditPatientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle updating patient details
  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;

    try {
      setUpdateLoading(true);

      const updatePayload = {
        personalInfo: {
          firstName: editPatientData.firstName.trim(),
          lastName: editPatientData.lastName.trim(),
          email: editPatientData.email.trim(),
          phone: editPatientData.phone.trim(),
          dateOfBirth: editPatientData.dateOfBirth || null,
          gender: editPatientData.gender || 'Other',
          address: editPatientData.address.trim()
        },
        updatedAt: new Date()
      };

      console.log('Updating patient:', selectedPatient.patientId, updatePayload);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/patient-details/by-patient-id/${selectedPatient.patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      console.log('Update patient response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update patient error:', errorText);
        throw new Error(`Failed to update patient: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Update patient success:', result);

      // Update the patient in local state
      const updatedPatient = result.patient || result.data;
      setPatients(prevPatients =>
        prevPatients.map(p =>
          p.patientId === selectedPatient.patientId ? updatedPatient : p
        )
      );

      // Update selected patient
      setSelectedPatient(updatedPatient);

      // Exit edit mode
      setIsEditMode(false);
      setEditPatientData({});

      alert(`Patient ${selectedPatient.patientId} updated successfully!`);

    } catch (err) {
      console.error('Error updating patient:', err);
      alert(`Failed to update patient: ${err.message}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle new patient form submission
  const handleCreatePatient = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Check if patient ID already exists
      const existingPatient = patients.find(p => p.patientId === newPatient.patientId);
      if (existingPatient) {
        alert(`Patient with ID ${newPatient.patientId} already exists. Please generate a new ID.`);
        return;
      }

      const patientToAdd = {
        patientId: newPatient.patientId,
        personalInfo: {
          firstName: newPatient.firstName.trim(),
          lastName: newPatient.lastName.trim(),
          email: newPatient.email.trim(),
          phone: newPatient.phone.trim(),
          dateOfBirth: newPatient.dob || null,
          gender: newPatient.gender || 'Other',
          address: newPatient.address.trim()
        },
        status: 'active'
      };

      console.log('Creating patient with data:', patientToAdd);

      const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'/api/patient-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientToAdd),
      });

      console.log('Create patient response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create patient error:', errorText);
        throw new Error(`Failed to create patient: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Create patient success:', result);

      // Add the new patient to the local state
      const createdPatient = result.patient || result.data || patientToAdd;
      setPatients(prevPatients => [...prevPatients, createdPatient]);

      // Clear form and generate new patient ID for next patient
      handleClearForm();

      alert(`Patient created successfully with ID: ${newPatient.patientId}`);

    } catch (err) {
      console.error('Error creating patient:', err);
      alert(`Failed to create patient: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for new patient form
  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle payment (placeholder function)
  const handlePayment = (billingRecord) => {
    setPaymentData({
      ...paymentData,
      amount: billingRecord.amount,
      description: `Payment for ${billingRecord.description}`
    });
    setShowPaymentModal(true);
  };

  // Process payment (placeholder function)
  const processPayment = async () => {
    try {
      // This would connect to your billing system
      alert('Payment processing functionality will be implemented with billing system.');
      setShowPaymentModal(false);
      setPaymentData({ amount: '', paymentMethod: 'cash', description: '' });
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Failed to process payment. Please try again.');
    }
  };

  if (loading && patients.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-info">
          <span>Welcome, {user?.name || "N/A"}e</span>
        </div>
      </header>

      <div className="admin-content">
        <div className="sidebar">
          <button
            className={activeTab === 'patientManagement' ? 'active' : ''}
            onClick={() => setActiveTab('patientManagement')}
          >
            Patient Management
          </button>
          <button
            className={activeTab === 'billing' ? 'active' : ''}
            onClick={() => setActiveTab('billing')}
          >
            Billing & Payments
          </button>
          <button
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
          <button onClick={handleLogout} className={activeTab === 'logout' ? 'active' : ''}>
          Logout
        </button>
        </div>

        <div className="main-content">
          {error && (
            <div style={{
              backgroundColor: 'rgba(248, 215, 218, 0.9)',
              color: '#721c24',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid rgba(245, 198, 203, 0.9)'
            }}>
              <strong>API Error:</strong> {error}
              <br />
              <small>Using mock data for demonstration. Please check your backend connection.</small>
            </div>
          )}

          {activeTab === 'patientManagement' && (
            <div className="tab-content">
              <h2>Patient Management</h2>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by Patient ID, Name or Phone (auto-populates if patient exists)"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <small style={{ display: 'block', marginTop: '5px', color: '#e8c2c2ff', fontSize: '16px' }}>
                  Tip: Search by Patient ID to auto-populate form with existing patient data
                </small>
              </div>

              <div className="patients-list">
                <h3>Existing Patients ({filteredPatients.length})</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map(patient => (
                      <tr key={patient._id} className={selectedPatient?._id === patient._id ? 'selected' : ''}>
                        <td>{patient.patientId}</td>
                        <td>{patient.personalInfo?.firstName || 'N/A'} {patient.personalInfo?.lastName || ''}</td>
                        <td>{patient.personalInfo?.phone || 'N/A'}</td>
                        <td>
                          <span className={`status ${patient.status === 'active' ? 'registered' : 'not-registered'}`}>
                            {patient.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleSelectPatient(patient)}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="patient-details">
                <h3>Patient Details</h3>
                {selectedPatient ? (
                  <div className="details-card">
                    {!isEditMode ? (
                      // View Mode
                      <>
                        <div className="detail-row">
                          <span className="label">Patient ID:</span>
                          <span className="value">{selectedPatient.patientId}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Name:</span>
                          <span className="value">{selectedPatient.personalInfo?.firstName} {selectedPatient.personalInfo?.lastName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Email:</span>
                          <span className="value">{selectedPatient.personalInfo?.email || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Phone:</span>
                          <span className="value">{selectedPatient.personalInfo?.phone || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Date of Birth:</span>
                          <span className="value">{selectedPatient.personalInfo?.dateOfBirth ? new Date(selectedPatient.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Gender:</span>
                          <span className="value">{selectedPatient.personalInfo?.gender || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Address:</span>
                          <span className="value">{selectedPatient.personalInfo?.address || 'N/A'}</span>
                        </div>

                        <div className="action-buttons">
                          <button className="btn-primary">
                            Complete Registration & Payment
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={handleEditPatient}
                          >
                            Edit Details
                          </button>
                        </div>
                      </>
                    ) : (
                      // Edit Mode
                      <>
                        <div className="edit-form">
                          <h4 style={{ marginBottom: '15px', color: '#007bff' }}>
                            Editing Patient: {selectedPatient.patientId}
                          </h4>

                          <div className="form-row">
                            <div className="form-group">
                              <label>First Name *</label>
                              <input
                                type="text"
                                name="firstName"
                                value={editPatientData.firstName}
                                onChange={handleEditInputChange}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Last Name *</label>
                              <input
                                type="text"
                                name="lastName"
                                value={editPatientData.lastName}
                                onChange={handleEditInputChange}
                                required
                              />
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Email</label>
                              <input
                                type="email"
                                name="email"
                                value={editPatientData.email}
                                onChange={handleEditInputChange}
                              />
                            </div>
                            <div className="form-group">
                              <label>Phone *</label>
                              <input
                                type="tel"
                                name="phone"
                                value={editPatientData.phone}
                                onChange={handleEditInputChange}
                                required
                              />
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Date of Birth</label>
                              <input
                                type="date"
                                name="dateOfBirth"
                                value={editPatientData.dateOfBirth}
                                onChange={handleEditInputChange}
                              />
                            </div>
                            <div className="form-group">
                              <label>Gender</label>
                              <select
                                name="gender"
                                value={editPatientData.gender}
                                onChange={handleEditInputChange}
                              >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Address</label>
                            <textarea
                              name="address"
                              value={editPatientData.address}
                              onChange={handleEditInputChange}
                              rows="3"
                            ></textarea>
                          </div>

                          <div className="action-buttons" style={{ marginTop: '20px' }}>
                            <button
                              className="btn-primary"
                              onClick={handleUpdatePatient}
                              disabled={updateLoading}
                            >
                              {updateLoading ? 'Updating...' : 'Save Changes'}
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={handleCancelEdit}
                              disabled={updateLoading}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p>Select a patient to view details</p>
                )}
              </div>

              <div className="create-patient">
                <h3>Create New Patient</h3>
                <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleGeneratePatientId}
                    disabled={generatingPatientId}
                    className="btn-secondary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {generatingPatientId ? '🔄 Generating...' : '🔄 Generate New Patient ID'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="btn-secondary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px'
                    }}
                  >
                    Clear Form
                  </button>
                  <small style={{ color: '#e8c2c2ff', fontSize: '16px' }}>
                    Patient ID is auto-generated and unique
                  </small>
                </div>

                <form onSubmit={handleCreatePatient}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Patient ID *</label>
                      <input
                        type="text"
                        name="patientId"
                        value={newPatient.patientId}
                        onChange={handleNewPatientChange}
                        required
                        readOnly
                        style={{
                          backgroundColor: '#f8f9fa',
                          cursor: 'not-allowed'
                        }}
                        placeholder="Auto-generated"
                      />
                      <small style={{ color: '#e8c2c2ff', fontSize: '16px' }}>
                        Auto-generated unique ID
                      </small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={newPatient.firstName}
                        onChange={handleNewPatientChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={newPatient.lastName}
                        onChange={handleNewPatientChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={newPatient.email}
                        onChange={handleNewPatientChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={newPatient.phone}
                        onChange={handleNewPatientChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        value={newPatient.dob}
                        onChange={handleNewPatientChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        name="gender"
                        value={newPatient.gender}
                        onChange={handleNewPatientChange}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={newPatient.address}
                      onChange={handleNewPatientChange}
                      rows="3"
                    ></textarea>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading || !newPatient.patientId}>
                    {loading ? 'Creating...' : 'Create Patient'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="tab-content">
              <h2>Billing & Payments</h2>
              <div className="billing-placeholder" style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem'
              }}>
                <h3>Billing System Coming Soon</h3>
                <p>We're working on implementing the billing functionality. Please check back later.</p>
                <div style={{ fontSize: '3rem', margin: '1rem 0' }}>💰</div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="tab-content">
              <h2>Reports</h2>
              <div className="reports-grid">
                <div className="report-card">
                  <h3>Patient Statistics</h3>
                  <p>Total Patients: {patients.length}</p>
                  <p>Active: {patients.filter(p => p.status === 'active').length}</p>
                  <p>New Today: {patients.filter(p => {
                    const today = new Date();
                    const created = new Date(p.createdAt);
                    return created.toDateString() === today.toDateString();
                  }).length}</p>
                </div>

                <div className="report-card">
                  <h3>Reports Coming Soon</h3>
                  <p>Detailed reporting functionality will be available soon.</p>
                </div>

                <div className="report-card">
                  <h3>Generate Reports</h3>
                  <button className="btn-primary">Patient List</button>
                  <button className="btn-primary">Billing Report</button>
                  <button className="btn-primary">Appointment Summary</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Process Payment</h3>
            <div className="modal-content">
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={paymentData.description}
                  onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={processPayment}
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;