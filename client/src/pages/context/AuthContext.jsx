// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const patientName = localStorage.getItem('patientName');
    const patientId = localStorage.getItem('patientId');
    const doctorName = localStorage.getItem('doctorName');
    const doctorId = localStorage.getItem('doctorId');
    const chiefdoctorName = localStorage.getItem('doctorName');
    const chiefdoctorId = localStorage.getItem('doctorId');
    const adminName = localStorage.getItem('adminName');
    const adminId = localStorage.getItem('adminId');

    if (token) {
      // Determine user type based on stored data
      if (patientId && patientName) {
        setUser({
          id: patientId,
          name: patientName,
          role: 'patient',
          token: token
        });
      } else if (doctorId && doctorName) {
        setUser({
          id: doctorId,
          name: doctorName,
          role: 'doctor',
          token: token
        });
      } else if (adminId && adminName) {
        setUser({
          id: adminId,
          name: adminName,
          role: 'admin',
          token: token
        });
      }
      else if (chiefdoctorId && chiefdoctorName){
         setUser({
          id: chiefdoctorId,
          name: chiefdoctorName,
          role: 'doctor',
          token: token
        });
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const { token, name, Identity, role } = userData;
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    
    if (role === 'patient') {
      localStorage.setItem('patientName', name);
      localStorage.setItem('patientId', Identity);
      setUser({
        id: Identity,
        name: name,
        role: 'patient',
        token: token
      });
    } else if (role === 'doctor') {
      localStorage.setItem('doctorName', name);
      localStorage.setItem('doctorId', Identity);
      setUser({
        id: Identity,
        name: name,
        role: 'doctor',
        token: token
      });
    } else if (role === 'admin') {
      localStorage.setItem('adminName', name);
      localStorage.setItem('adminId', Identity);
      setUser({
        id: Identity,
        name: name,
        role: 'admin',
        token: token
      });
    }
  };

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('patientName');
    localStorage.removeItem('patientId');
    localStorage.removeItem('doctorName');
    localStorage.removeItem('doctorId');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminId');
    localStorage.removeItem('role');
    
    // Reset state
    setUser(null);
    
    // Redirect to home page
    window.location.href = '/';
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};