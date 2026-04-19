import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Menü öğeleri
  const menuItems = [
    {
      id: 'calendar',
      label: 'Takvim',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      path: '/events'
    },
    {
      id: 'day',
      label: 'Bugün',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <path d="M3 10h18" />
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <path d="M10 14h4" />
          <path d="M12 14v4" />
        </svg>
      ),
      path: '/today'
    }
  ];

  // Sadece login olduktan sonra göstermek için burası
  const token = localStorage.getItem('token');
  if (!token || location.pathname === '/') return null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isHovered ? '240px' : '70px',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #E5E7EB',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden',
        boxShadow: isHovered ? '4px 0 15px rgba(0,0,0,0.05)' : 'none'
      }}
    >
      {/* Menü Listesi burda */}
      <div style={{ marginTop: '20px', padding: '0 12px' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '8px',
                backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                color: isActive ? '#3B82F6' : '#6B7280',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.color = '#374151';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6B7280';
                }
              }}
            >
              <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>
                {item.icon}
              </div>
              {isHovered && (
                <span style={{ marginLeft: '12px', fontWeight: '500', fontSize: '15px' }}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Alt Kısım versiyon yazak yer buraı*/}
      <div style={{ marginTop: 'auto', padding: '20px 12px', borderTop: '1px solid #F3F4F6' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 12px',
            color: '#af9caaff',
            fontSize: '12px'
          }}
        >
          <div style={{ minWidth: '24px', textAlign: 'center' }}></div>
          {isHovered && <span style={{ marginLeft: '12px' }}>V 1.0.0</span>}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
