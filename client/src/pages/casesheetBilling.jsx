// casesheetBilling.jsx
import React, { useState } from 'react';
import './casesheetBilling.css';

const BillX = () => {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [amount, setAmount] = useState('');
  
  const urlParams = new URLSearchParams(window.location.search);
  const nextPage = urlParams.get("nextPage");
  const dept = nextPage ? decodeURIComponent(nextPage).split("/").pop().split(" ")[0].toUpperCase() : "";

  const showPaymentAlert = (method) => {
    alert(`${method} Payment Successful`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nextPage) {
      window.location.href = '/pedodontics';
    }
  };

  return (
    <div className="casesheet-billing-wrapper">
      <div className="casesheet-billing-container">
        <h1 className="casesheet-billing-title">Case Billing Form</h1>
        <h2 className="casesheet-billing-department">Department: {dept}</h2>
        <form className="casesheet-billing-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Patient ID" 
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required 
          />
          <input 
            type="text" 
            placeholder="Patient Name" 
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required 
          />
          <input 
            type="number" 
            placeholder="Amount" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required 
          />

          <div className="casesheet-payment-options">
            <h3>PAYMENT METHOD</h3>
            <div className="casesheet-payment-buttons">
              <div className="casesheet-pay-option" onClick={() => showPaymentAlert('UPI')}>
                UPI
              </div>
              <div className="casesheet-pay-option" onClick={() => showPaymentAlert('Net Banking')}>
                NET BANKING
              </div>
              <div className="casesheet-pay-option" onClick={() => showPaymentAlert('Cash')}>
                CASH
              </div>
            </div>
          </div>

          <div className="casesheet-button-group">
            <button type="submit">Continue to Case Sheet</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillX;
