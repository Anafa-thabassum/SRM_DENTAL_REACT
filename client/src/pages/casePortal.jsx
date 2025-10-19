import React, { useState } from 'react';
import './casePortal.css';
const CasePortal = () => {
  const [showProsthodontics, setShowProsthodontics] = useState(false);
  const [showOral, setShowOral] = useState(false);
  const [showPerio, setShowPerio] = useState(false);

  const startCaseFlow = (targetPage) => {
    window.location.href = `/case_sheet_bill?nextPage=${encodeURIComponent(targetPage)}`;
  };

  return (
    <div className="case-portal-container">
      <div className="container-portal">
        <div className="heading">Select Case Sheet</div>

        <div className="button-group-portal" id="mainButtonGroup" style={{ display: showProsthodontics || showOral || showPerio ? 'none' : 'flex' }}>
          <button className="button-portal" onClick={() => setShowProsthodontics(true)}>Prosthodontics</button>
          <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Pedodontics</button>
          <button className="button-portal" onClick={() => setShowPerio(true)}>Periodontics</button>
          <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Conservative Dentistry and Endodontics</button>
          <button className="button-portal" onClick={() => setShowOral(true)}>Oral and Maxillofacial</button>
          <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Orthoganthic Case History</button>
          <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>General</button>
        </div>

        {/* Prosthodontics sub-options */}
        {showProsthodontics && (
          <div className="sub-options" id="prosthodonticsSubOptions">
            <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Implant Patient Surgery</button>
            <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Complete Denture</button>
            <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Partial Denture</button>
            <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Implant</button>
            <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>F.P.D</button>
          </div>
        )}

        {/* Oral and Maxillofacial sub-options */}
        {showOral && (
          <div className="sub-options" id="oralSubOptions">
            <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Clef Lip</button>
            <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Trauma</button>
            <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Impaction</button>
            <button className="button-portal" onClick={() => startCaseFlow('/case_sheet_bill')}>Pathology</button>
          </div>
        )}

        {/* Periodontics sub-options */}
        {showPerio && (
          <div className="sub-options" id="perioSubOptions">
            <button className="button-portal" onClick={() => startCaseFlow('periodontics longcase sheet.html')}>Long Case Sheet</button>
            <button className="button-portal" onClick={() => startCaseFlow('periodont short case sheet.html')}>Short Case Sheet</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasePortal;