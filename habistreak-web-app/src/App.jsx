import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ResetPassword from './pages/ResetPassword';

const App = () => {
  return (
    <Routes>
      <Route path="/resetpassword/:token" element={<ResetPassword />} />
      <Route path="*" element={<div style={{ textAlign: 'center', marginTop: 100 }}>404 - Page Not Found</div>} />
    </Routes>
  );
};

export default App;
