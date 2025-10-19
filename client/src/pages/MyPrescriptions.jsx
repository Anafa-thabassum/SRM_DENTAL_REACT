import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPrescriptions.css';

const MyPrescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const navigate = useNavigate();

    const patientId = localStorage.getItem('patientId');
    const patientName = localStorage.getItem('patientName');

    useEffect(() => {
        // Redirect if not authenticated
        const token = localStorage.getItem('token');
        if (!token || !patientId) {
            navigate('/patient-login', { replace: true });
            return;
        }

        fetchPrescriptions();
    }, [patientId, navigate]);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/api/prescriptions/patient/${patientId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setPrescriptions(result.data);
            } else {
                throw new Error(result.message || 'Failed to fetch prescriptions');
            }
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDosage = (dosage) => {
        const { m, n, e, n2 } = dosage;
        return `${m}-${n}-${e}-${n2}`;
    };

    const handleBackToDashboard = () => {
        navigate('/patient-dashboard');
    };

    const openPrescriptionDetails = (prescription) => {
        setSelectedPrescription(prescription);
    };

    const closePrescriptionDetails = () => {
        setSelectedPrescription(null);
    };

    const printPrescription = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="prescriptions-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading your prescriptions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="prescriptions-container">
                <button onClick={handleBackToDashboard} className="back-btn">
                    ← Back to Dashboard
                </button>
                <div className="error-message">
                    <h2>Error Loading Prescriptions</h2>
                    <p>{error}</p>
                    <button onClick={fetchPrescriptions} className="retry-btn">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="prescriptions-container">
            <div className="prescriptions-header">
                <button onClick={handleBackToDashboard} className="back-btn">
                    ← Back to Dashboard
                </button>
                <div className="header-info">
                    <h1>My Prescriptions</h1>
                    <p className="patient-info">
                        <strong style={{ fontSize: '16px', color: '#e9ecf2ff' }}>{patientName}</strong> • Patient ID: {patientId}
                    </p>
                </div>
            </div>

            {prescriptions.length === 0 ? (
                <div className="no-prescriptions">
                    <div className="no-prescriptions-icon">📋</div>
                    <h2>No Prescriptions Found</h2>
                    <p>You don't have any prescriptions yet. Visit your doctor to get your first prescription.</p>
                </div>
            ) : (
                <div className="prescriptions-grid">
                    {prescriptions.map((prescription, index) => (
                        <div key={prescription._id} className="prescription-card">
                            <div className="prescription-header">
                                <div className="visit-number">
                                    <span className="visit-label">Visit #{prescriptions.length - index}</span>
                                    <span className="prescription-date">
                                        {formatDate(prescription.patientData.date)}
                                    </span>
                                </div>
                                <div className="prescription-status">
                                    <span className={`status-badge ${prescription.status}`}>
                                        {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="prescription-summary">
                                <div className="summary-item">
                                    <span className="label">Doctor:</span>
                                    <span className="value">{prescription.doctorName}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Diagnosis:</span>
                                    <span className="value diagnosis-text">{prescription.diagnosis}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Medicines:</span>
                                    <span className="value">{prescription.medicines.length} prescribed</span>
                                </div>
                                {prescription.nextVisitDate && (
                                    <div className="summary-item">
                                        <span className="label">Next Visit:</span>
                                        <span className="value next-visit">
                                            {formatDate(prescription.nextVisitDate)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="prescription-actions">
                                <button
                                    onClick={() => openPrescriptionDetails(prescription)}
                                    className="view-details-btn"
                                >
                                    View Full Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Prescription Details Modal */}
            {selectedPrescription && (
                <div className="modal-overlay" onClick={closePrescriptionDetails}>
                    <div className="prescription-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="clinic-info">
                                <img
                                    src="/images/logo.png"
                                    alt="Clinic Logo"
                                    className="modal-logo"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://placehold.co/80x32/25286b/ffffff?text=SRM';
                                    }}
                                />
                                <div>
                                    <h2 style={{ fontSize: '20px', color: '#e9ecf2ff' }}>{selectedPrescription.clinicName || 'SRM Dental College'}</h2>
                                    <p style={{ fontSize: '16px', color: '#d8dadeff' }} className="prescription-title">Prescription Details</p>
                                </div>
                            </div>
                            <button onClick={closePrescriptionDetails} className="close-btn">
                                ×
                            </button>
                        </div>

                        <div className="modal-content">
                            <div className="prescription-info">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <strong>Patient:</strong> {selectedPrescription.patientData.name}
                                    </div>
                                    <br />
                                    <div className="info-item">
                                        <strong>Age:</strong> {selectedPrescription.patientData.age}
                                    </div>
                                    <br />
                                    <div className="info-item">
                                        <strong>Gender:</strong> {selectedPrescription.patientData.gender}
                                    </div>
                                    <br />
                                    <div className="info-item">
                                        <strong>Date:</strong> {formatDate(selectedPrescription.patientData.date)}
                                    </div>
                                    <br />
                                </div>
                            </div>

                            <div className="symptoms-diagnosis">
                                <div className="section">
                                    <strong>Symptoms:</strong>
                                    <p>{selectedPrescription.symptoms}</p>
                                </div>
                                <div className="section">
                                    <strong>Diagnosis:</strong>
                                    <p>{selectedPrescription.diagnosis}</p>
                                </div>
                            </div>

                            <div className="medicines-section">
                                <h3 style={{ color: '#ffffff' }}>Prescribed Medicines</h3>
                                <div className="medicines-table-wrapper">
                                    <table className="medicines-table">
                                        <thead>
                                            <tr>
                                                <th>S.No.</th>
                                                <th>Type</th>
                                                <th>Medicine Name</th>
                                                <th>
                                                    Dosage <br /> (M-N-E-N)
                                                </th>
                                                <th>Food</th>
                                                <th>Duration</th>
                                                <th>As Needed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPrescription.medicines.map((medicine, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <span className={`medicine-type ${medicine.type}`}>
                                                            {medicine.type.charAt(0).toUpperCase() + medicine.type.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="medicine-name">{medicine.name}</td>
                                                    <td className="dosage">{formatDosage(medicine.dosage)}</td>
                                                    <td>
                                                        <span className={`food-intake ${medicine.foodIntake}`}>
                                                            {medicine.foodIntake === 'after' ? 'After Food' : 'Before Food'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {medicine.type === 'injection' ? (
                                                            <span className="injection-duration">Every Visit</span>
                                                        ) : (
                                                            `${medicine.duration} days`
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`as-needed ${medicine.asNeeded ? 'yes' : 'no'}`}>
                                                            {medicine.asNeeded ? 'Yes' : 'No'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {selectedPrescription.advice && (
                                <div className="advice-section">
                                    <strong>Doctor's Advice:</strong>
                                    <p>{selectedPrescription.advice}</p>
                                </div>
                            )}

                            <div className="doctor-info">
                                <strong>Prescribed by:</strong> {selectedPrescription.doctorName}
                                <br />
                                <strong>Doctor ID:</strong> {selectedPrescription.doctorId}
                                {selectedPrescription.nextVisitDate && (
                                    <>
                                        <br />
                                        <strong>Next Visit Date:</strong> {formatDate(selectedPrescription.nextVisitDate)}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={printPrescription} className="print-btn">
                                Print Prescription
                            </button>
                            <button onClick={closePrescriptionDetails} className="close-modal-btn">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPrescriptions;