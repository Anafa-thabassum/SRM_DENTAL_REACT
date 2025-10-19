// CaseSheetPrescription.jsx
import React, { useState, useEffect } from 'react';

const CaseSheetPrescription = () => {
  const [patientId, setPatientId] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  useEffect(() => {
    // Get patient ID from localStorage or props
    const storedPatientId = localStorage.getItem('CurrentpatientId');
    if (storedPatientId) {
      setPatientId(storedPatientId);
      fetchPatientPrescriptions(storedPatientId);
    }
  }, []);

  const fetchPatientPrescriptions = async (id) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/prescriptions/patient/${id}`);
      if (response.ok) {
        const result = await response.json();
        setPrescriptions(result.data);
      } else {
        console.error('Failed to fetch prescriptions');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPatient = () => {
    if (patientId.trim()) {
      fetchPatientPrescriptions(patientId.trim());
    }
  };

  const viewPrescriptionDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowPrescriptionModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDosage = (dosage) => {
    return `${dosage.m}-${dosage.n}-${dosage.e}-${dosage.n2}`;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2c5282', marginBottom: '20px' }}>Patient Case Sheet - Prescription History</h2>
        
        {/* Patient ID Search */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontWeight: 'bold' }}>Patient ID:</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter Patient ID (e.g., U1001)"
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '200px' }}
          />
          <button
            onClick={handleSearchPatient}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2c5282',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading prescriptions...</div>}

        {!loading && prescriptions.length === 0 && patientId && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No prescriptions found for this patient.
          </div>
        )}

        {!loading && prescriptions.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '15px' }}>
              Prescription History ({prescriptions.length} records)
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Doctor</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Symptoms</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Diagnosis</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Medicines</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((prescription) => (
                    <tr key={prescription._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {formatDate(prescription.createdAt)}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {prescription.doctorName}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', maxWidth: '150px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prescription.symptoms}
                        </div>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', maxWidth: '200px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prescription.diagnosis}
                        </div>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {prescription.medicines.length} medicine(s)
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: prescription.status === 'active' ? '#d1ecf1' : '#d4edda',
                          color: prescription.status === 'active' ? '#0c5460' : '#155724'
                        }}>
                          {prescription.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        <button
                          onClick={() => viewPrescriptionDetails(prescription)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#2c5282',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Prescription Details Modal */}
      {showPrescriptionModal && selectedPrescription && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: '0', color: '#2c5282' }}>Prescription Details</h3>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Patient & Doctor Info */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ marginTop: '0' }}>Patient Information</h4>
                  <p><strong>Name:</strong> {selectedPrescription.patientData.name}</p>
                  <p><strong>Patient ID:</strong> {selectedPrescription.patientId}</p>
                  <p><strong>Age:</strong> {selectedPrescription.patientData.age}</p>
                  <p><strong>Gender:</strong> {selectedPrescription.patientData.gender}</p>
                </div>
                <div>
                  <h4 style={{ marginTop: '0' }}>Prescription Information</h4>
                  <p><strong>Doctor:</strong> {selectedPrescription.doctorName}</p>
                  <p><strong>Date:</strong> {formatDate(selectedPrescription.createdAt)}</p>
                  <p><strong>Clinic:</strong> {selectedPrescription.clinicName}</p>
                  <p><strong>Status:</strong> {selectedPrescription.status}</p>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <h4>Symptoms</h4>
                <p style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', margin: '0' }}>
                  {selectedPrescription.symptoms}
                </p>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <h4>Diagnosis</h4>
                <p style={{ padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px', margin: '0' }}>
                  {selectedPrescription.diagnosis}
                </p>
              </div>
              {selectedPrescription.advice && (
                <div style={{ marginBottom: '15px' }}>
                  <h4>Doctor's Advice</h4>
                  <p style={{ padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px', margin: '0' }}>
                    {selectedPrescription.advice}
                  </p>
                </div>
              )}
            </div>

            {/* Medicines Table */}
            <div style={{ marginBottom: '20px' }}>
              <h4>Prescribed Medicines</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>S.No</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Medicine</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Dosage</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Food</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Duration</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>As Needed</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPrescription.medicines.map((medicine, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{index + 1}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{medicine.name}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textTransform: 'capitalize' }}>
                        {medicine.type}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {medicine.asNeeded ? 'As Needed' : formatDosage(medicine.dosage)}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {medicine.asNeeded ? '-' : (medicine.foodIntake === 'after' ? 'After Food' : 'Before Food')}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {medicine.asNeeded ? '-' : `${medicine.duration} days`}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {medicine.asNeeded ? '✓' : '✗'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Next Visit & Billing Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {selectedPrescription.nextVisitDate && (
                <div>
                  <h4>Next Visit Date</h4>
                  <p style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', margin: '0' }}>
                    {formatDate(selectedPrescription.nextVisitDate)}
                  </p>
                </div>
              )}
              <div>
                <h4>Billing Status</h4>
                <p style={{ 
                  padding: '10px', 
                  backgroundColor: selectedPrescription.billing?.isGenerated ? '#d4edda' : '#f8d7da', 
                  borderRadius: '4px', 
                  margin: '0' 
                }}>
                  {selectedPrescription.billing?.isGenerated ? 
                    `Bill Generated - ₹${selectedPrescription.billing.totalAmount}` : 
                    'Billing Pending'
                  }
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Print Prescription
              </button>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseSheetPrescription;