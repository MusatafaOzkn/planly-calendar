import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import EventList from './components/EventList';
import Login from './components/Login';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Today from './components/Today';
import Profile from './components/Profile';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#F9FAFB' }}>
      {!isAuthPage && <Header />}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!isAuthPage && <Sidebar />}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/today" element={<Today />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
