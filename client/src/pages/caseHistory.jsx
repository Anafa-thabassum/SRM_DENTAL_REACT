import React, { useState, useEffect } from "react";
import { useAuth } from './context/AuthContext';
import "./caseHistory.css"; 

const CaseHistory = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patientInfo, setPatientInfo] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Get current patient details from localStorage
    const patientId = localStorage.getItem('CurrentpatientId');
    const patientName = localStorage.getItem('CurrentpatientName');
    
    if (patientId && patientName) {
      setPatientInfo({
        id: patientId,
        name: patientName
      });
      fetchDoctorPatientCases(patientId, user?.id);
    } else {
      setError("No patient selected. Please select a patient first.");
      setLoading(false);
    }
  }, [user]);

  const fetchDoctorPatientCases = async (patientId, doctorId) => {
    try {
      setError("");
      const token = localStorage.getItem('token');
      
      // Fetch cases for this specific patient and doctor combination
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/pedodontics/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCases(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(`Failed to fetch cases: ${response.status} ${errorData.message || ''}`);
      }
    } catch (error) {
      console.error('Error fetching patient cases:', error);
      setError(`Error fetching cases: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const viewCaseSheet = (caseId) => {
    window.open(`/case-sheet-view/${caseId}`, '_blank');
  };

  const viewPrescription = (caseId) => {
    window.open(`/prescription/${caseId}`, '_blank');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="case-history-container">Loading cases...</div>;
  }

  return (
    <div className="case-history-page">
      <div className="case-history-container">
        <div className="dashboard-header">
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="logo-box-user">
            <img 
              src="/images/logo.png" 
              alt="SRM Dental College Logo" 
              className="logo-img-user" 
              onError={(e) => { 
                e.target.onerror = null; 
                e.target.src = 'https://placehold.co/100x40/25286b/ffffff?text=SRM+Dental'; 
              }} 
              style={{width :'100px', height : '100px' }}
            />
          </div>
          <h1>Patient Case Overview</h1>
        </div>

        {patientInfo && (
          <div className="patient-info-section">
            <h2 className="patient-name">Patient: {patientInfo.name}</h2>
            <p className="patient-id">Patient ID: {patientInfo.id}</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => fetchPatientCases(patientInfo.id)}>Retry</button>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient ID</th>
              <th>Doctor in Charge</th>
              <th>Status</th>
              <th>Case Sheets</th>
              <th>Prescription</th>
            </tr>
          </thead>
          <tbody>
            {cases.length > 0 ? (
              cases.map((caseItem) => (
                <tr key={caseItem._id}>
                  <td>{formatDate(caseItem.createdAt)}</td>
                  <td>{caseItem.patientId}</td>
                  <td>{caseItem.doctorName}</td>
                  <td>
                    <span className={`status-badge ${caseItem.chiefApproval ? 
                      (caseItem.chiefApproval.toLowerCase().includes("approved") ? "approved" : "redo") : 
                      "pending"}`}>
                      {caseItem.chiefApproval ? 
                        (caseItem.chiefApproval.toLowerCase().includes("approved") ? "Approved" : "Review Needed") : 
                        "Pending"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-button"
                      onClick={() => viewCaseSheet(caseItem._id)}
                    >
                      View
                    </button>
                  </td>
                  <td>
                    <button
                      className="view-button"
                      onClick={() => viewPrescription(caseItem._id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No cases found for this patient
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CaseHistory;