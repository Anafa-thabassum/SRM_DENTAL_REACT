import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/AppHome';
import Login from './pages/Login';
import AdminLogin from './pages/Adminloginpage';
import PatientLogin from './pages/PatientLogin';
import DoctorLogin from './pages/DoctorLogin';
import SignUp from './pages/SignUp';
import SlotBooking from './pages/SlotBooking';
import PatientDashboard from './pages/PatientDashboard';
import UserType from './pages/UserType';
import DoctorDashboard from './pages/DoctorDashboard';
import ChiefDoctorDashboard from './pages/ChiefDoctorDashboard'
import UpdatePatient from './pages/UpdatePatient';
import MyAppointment from './pages/MyAppointment';
import DoctorSchedule from './pages/DoctorSchedules';
import CasePortal from './pages/casePortal';
import BillX from './pages/casesheetBilling';
import Pedodontics from './pages/departments/Pedodontics';
import { AuthProvider } from './pages/context/AuthContext';
import ProtectedRoute from './pages/context/ProtectedRoute';
import Prescription from './pages/prescription';
import AdminDashboard from './pages/AdminDashboard';
import CaseSheetView from './pages/CaseSheetView';
import CaseHistory from './pages/caseHistory';
import Unauthorized from './pages/Unauthorized'; // Import the new component
import ForgetPassword from './pages/forgetpassword';
import MyPrescriptions from './pages/MyPrescriptions';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/adminlogin" element={<AdminLogin />} />
          <Route path="/login/patientlogin" element={<PatientLogin />} />
          <Route path="/login/doctorlogin" element={<DoctorLogin />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/user" element={<UserType />} />
          <Route path="/my-prescriptions" element={<MyPrescriptions />} />
          {/* Protected Routes */}
          <Route
            path="/patient-dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor-dashboard"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'chief-doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Other Routes */}
          <Route path="/chief-doctor-dashboard" element={<ChiefDoctorDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/slot-booking" element={<SlotBooking />} />
          <Route path="/update-patient" element={<UpdatePatient />} />
          <Route path="/my-appointments" element={<MyAppointment />} />
          <Route path="/doctor-schedule" element={<DoctorSchedule />} />
          <Route path="/casePortal" element={<CasePortal />} />
          <Route path="/case_sheet_bill" element={<BillX />} />
          <Route path="/pedodontics" element={<Pedodontics />} />
          <Route path="/prescriptions" element={<Prescription />} />
          <Route path="/case-sheet-view/:caseId" element={<CaseSheetView />} />
          <Route path='/case-history' element={<CaseHistory />} />

          <Route path='/reset-password' element={<ForgetPassword />} />
          <Route path="/unauthorized" element={<center><h2>UnAuthorized Access Try!</h2></center>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;