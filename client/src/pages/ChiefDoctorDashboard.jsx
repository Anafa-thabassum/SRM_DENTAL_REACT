import React, { useState, useEffect } from "react";
import { useAuth } from './context/AuthContext';
import "./ChiefDoctorDashboard.css"; 

const ChiefDoctorDashboard = () => {
  const [cases, setCases] = useState([]);
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [showRedoBox, setShowRedoBox] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [message, setMessage] = useState("");
  const [redoReason, setRedoReason] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setError("");
      const token = localStorage.getItem('token');
      
      const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'/api/pedodontics/chief/all-cases', {
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
      console.error('Error fetching cases:', error);
      setError(`Error fetching cases: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(); 
  };

  const handleApprove = async (caseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/pedodontics/${caseId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          chiefApproval: "Approved",
          approvedBy: user?.name || "Chief Doctor",
          approvedAt: new Date()
        })
      });
      
      if (response.ok) {
        setMessageTitle("Approval");
        setMessage("Case Approved!");
        setShowMessageBox(true);
        fetchCases(); // Refresh the list
      } else {
        console.error('Failed to approve case');
        setError('Failed to approve case');
      }
    } catch (error) {
      console.error('Error approving case:', error);
      setError('Error approving case');
    }
  };

  const handleRedo = (caseItem) => {
    console.log("Redo button clicked", caseItem);
    setSelectedCase(caseItem);
    setShowRedoBox(true);
    console.log("showRedoBox set to true");
  };

  const submitRedoReason = async () => {
    if (!redoReason.trim()) {
      alert("Please enter a reason.");
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/pedodontics/${selectedCase._id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          chiefApproval: `Redo Requested: ${redoReason}`,
          approvedBy: user?.name || "Chief Doctor",
          approvedAt: new Date()
        })
      });
      
      if (response.ok) {
        setShowRedoBox(false);
        setMessageTitle("Redo Submitted");
        setMessage("Case sent for redo with reason:\n" + redoReason);
        setShowMessageBox(true);
        setRedoReason("");
        setSelectedCase(null);
        fetchCases(); // Refresh the list
      } else {
        console.error('Failed to submit redo request');
        setError('Failed to submit redo request');
      }
    } catch (error) {
      console.error('Error submitting redo request:', error);
      setError('Error submitting redo request');
    }
  };

  const viewCaseSheet = (caseId) => {
    window.open(`/case-sheet-view/${caseId}`, '_blank');
  };

  const viewPrescription = (caseId) => {
    window.open(`/prescription/${caseId}`, '_blank');
  };

  const getApprovalStatus = (caseItem) => {
    if (!caseItem.chiefApproval) return "Pending";
    if (caseItem.chiefApproval.toLowerCase().includes("approved")) return "Approved";
    if (caseItem.chiefApproval.toLowerCase().includes("redo")) return "Redo Requested";
    return caseItem.chiefApproval;
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case "Approved":
        return "status-badge approved";
      case "Redo Requested":
        return "status-badge redo";
      default:
        return "status-badge pending";
    }
  };

  if (loading) {
    return <div className="chief-container">Loading cases...</div>;
  }

  return (
    <div className="chief-container-page">
      <div className="chief-container">
        <div className="logout-btn-box">
          <button onClick={handleLogout} className="logout-btn-chief">
            Logout
          </button>
          </div>
        <div className="dashboard-header">
          <div className="doctor-info">
            <h2 className="doctor-info-name">
              Dr. {user?.name || "Chief Doctor"}
            </h2>
            <h6 className="doctor-info-id">
              Doctor ID: {user?.id || "N/A"}
            </h6>
          </div>
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
              style={{ width: 100, height: 100 }}

            />
          </div>
          <h1>Case Overview - Chief Doctor</h1>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={fetchCases}>Retry</button>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Department</th>
              <th>Doctor in Charge</th>
              <th>Patient Name</th>
              <th>Status</th>
              <th>Case Sheets</th>
              <th>Prescription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.length > 0 ? (
              cases.map((caseItem, index) => {
                const status = getApprovalStatus(caseItem);
                return (
                  <tr key={caseItem._id}>
                    <td>{index + 1}</td>
                    <td>Pedodontics</td>
                    <td>{caseItem.doctorName}</td>
                    <td>{caseItem.patientName}</td>
                    <td>
                      <span className={getStatusBadgeClass(status)}>
                        {status}
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
                    <td>
                      {status === "Pending" ? (
                        <div className="action-buttons">
                          <button
                            className="action-button approve-btn"
                            onClick={() => handleApprove(caseItem._id)}
                          >
                            Approve
                          </button>
                          <button
                            className="action-button redo-btn"
                            onClick={() => handleRedo(caseItem)}
                          >
                            Redo
                          </button>
                        </div>
                      ) : (
                        <span>No actions available</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="text-center">
                  No cases found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Message Modal */}
        {showMessageBox && (
          <div className="message-box-container show">
            <div className="message-box">
              <h2>{messageTitle}</h2>
              <p>{message}</p>
              <button onClick={() => setShowMessageBox(false)}>OK</button>
            </div>
          </div>
        )}

        {/* Redo Reason Modal */}
        {showRedoBox && (
          <div className="message-box-container show">
            <div className="message-box">
              <h2>Redo Request</h2>
              <p>Please provide detailed suggestions for improvement:</p>
              <textarea
                rows="6"
                value={redoReason}
                onChange={(e) => setRedoReason(e.target.value)}
                placeholder="Enter your suggestions and reasons for requesting a redo..."
                className="redo-textarea"
              />
              <div className="redo-buttons">
                <button onClick={submitRedoReason}>Submit Request</button>
                <button 
                  onClick={() => {
                    setShowRedoBox(false);
                    setRedoReason("");
                    setSelectedCase(null);
                  }}
                  className="cancel-btn"
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

export default ChiefDoctorDashboard;