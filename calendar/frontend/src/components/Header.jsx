import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { brandConfig } from '../config/brandConfig';
import api from '../services/api';

function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [userName, setUserName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Arama durumları
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const isValidToken = (t) => {
      return typeof t === 'string' && t.split('.').length === 3;
    };

    if (token && isValidToken(token)) {
      try {
        const decoded = jwtDecode(token);
        setUserName(decoded.name || decoded.username || 'Kullanıcı');
      } catch (error) {
        console.error('Token çözme hatası:', error);
        localStorage.removeItem('token');
        setUserName('');
      }
    } else {
      if (token) {
        localStorage.removeItem('token');
      }
      setUserName('');
    }
  }, [token]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Etkinlikleri ve Tatilleri çek
  const fetchData = async () => {
    if (token) {
      try {
        const [eventsRes, holidaysRes] = await Promise.all([
          api.get('/events'),
          fetch('https://date.nager.at/api/v3/PublicHolidays/2026/TR').then(r => r.json())
        ]);
        setAllEvents(eventsRes.data);
        const transformedHolidays = holidaysRes.map(h => ({
           id: h.localName,
           title: h.localName,
           date: h.date,
           type: 'holiday',
           icon: '🎉'
        }));
        setSearchResults(prev => {
            // we will re-filter in the other effect
            return prev;
        });
        // Store holidays in a separate state or combine
        sessionStorage.setItem('holidays', JSON.stringify(transformedHolidays));
      } catch (err) {
        console.error("Veriler yüklenemedi:", err);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Arama filtreleme
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const query = searchQuery.toLowerCase();
      const savedHolidays = JSON.parse(sessionStorage.getItem('holidays') || '[]');
      
      // 1. Etkinliklerde ve Tatillerde ara
      const eventMatches = [...allEvents, ...savedHolidays].filter(evt => 
        evt.title.toLowerCase().includes(query) || 
        (evt.description && evt.description.toLowerCase().includes(query))
      ).map(evt => ({
        id: evt._id || evt.id,
        title: evt.title,
        date: evt.startDate || evt.date,
        type: evt.type || 'event',
        icon: evt.icon || '📅'
      }));

      // 2. Tarih formatı ara (Örn: "20 nisan", "Bugün", "Yarın")
      const dateMatches = [];
      const turkishMonths = ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"];
      
      turkishMonths.forEach((month, index) => {
        if (query.includes(month)) {
          const dayMatch = query.match(/\d+/);
          if (dayMatch) {
            const day = dayMatch[0];
            const year = new Date().getFullYear();
            const dateStr = `${year}-${String(index + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dateMatches.push({
              id: 'date-' + dateStr,
              title: `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} Gününe Git`,
              date: dateStr,
              type: 'date',
              icon: '🔍'
            });
          }
        }
      });

      setSearchResults([...dateMatches, ...eventMatches].slice(0, 8));
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [searchQuery, allEvents]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleResultClick = (result) => {
    const targetDate = new Date(result.date);
    const dateStr = targetDate.toISOString().split('T')[0];
    navigate(`/events?date=${dateStr}`);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const firstLetter = userName ? userName.charAt(0).toUpperCase() : '?';

  // --- STİLLER ---
  const headerStyle = {
    backgroundColor: '#ffffff',
    padding: '12px 30px',
    borderBottom: '1px solid #E8EBEF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '70px',
    position: 'relative',
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
  };

  const logoStyle = { textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' };

  const logoIconStyle = { height: '40px', display: 'flex', alignItems: 'center', justifyContents: 'center' };

  const logoTextStyle = { color: '#1F2937', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' };

  const searchContainerStyle = { position: 'relative', width: '350px', display: 'flex', alignItems: 'center' };

  const searchInputStyle = {
    backgroundColor: '#F3F4F6',
    border: 'none',
    borderRadius: '14px',
    padding: '10px 15px 10px 45px',
    width: '100%',
    fontSize: '14px',
    color: '#1F2937',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const searchIconStyle = {
    position: 'absolute',
    left: '16px',
    color: '#9CA3AF',
    fontSize: '16px'
  };

  const searchResultsStyle = {
    position: 'absolute',
    top: '50px',
    left: '0',
    right: '0',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid #E5E7EB',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 1001,
    display: isSearchOpen && searchResults.length > 0 ? 'block' : 'none',
    padding: '8px'
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '60px',
    right: '0',
    backgroundColor: '#ffffff',
    border: '1px solid #E5E7EB',
    borderRadius: '16px',
    boxShadow: '0 15px 35px rgba(0,0,0,0.12)',
    width: '180px',
    display: isMenuOpen ? 'block' : 'none',
    overflow: 'hidden',
    zIndex: 1001,
    padding: '8px 0',
  };

  const profileTriggerStyle = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '6px 14px',
    borderRadius: '12px',
    transition: 'background-color 0.2s',
    backgroundColor: isMenuOpen ? '#F3F4F6' : 'transparent',
    gap: '10px'
  };

  const avatarStyle = {
    width: '36px',
    height: '36px',
    backgroundColor: '#007bff',
    color: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '15px',
    border: '2px solid #ffffff',
    boxShadow: '0 0 0 2px #E0E7FF'
  };

  return (
    <nav style={headerStyle}>
      <Link to="/events" style={logoStyle}>
        <div style={logoIconStyle}>
          {brandConfig.brandLogo.startsWith('/') || brandConfig.brandLogo.includes('.') ? (
            <img src={brandConfig.brandLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} />
          ) : (
            brandConfig.brandLogo
          )}
        </div>
        <span style={logoTextStyle}>
          {brandConfig.brandName}
        </span>
      </Link>

      {/* ARAMA BÖLÜMÜ */}
      <div style={searchContainerStyle} ref={searchRef}>
        <span style={searchIconStyle}>🔍</span>
        <input
          type="text"
          placeholder="Etkinlik veya tarih ara... (örn: 20 nisan)"
          style={searchInputStyle}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            fetchData();
            if (searchQuery.length > 1) setIsSearchOpen(true);
          }}
        />
        
        {/* Arama Sonuçları Dropdown */}
        <div style={searchResultsStyle}>
          {searchResults.map(result => (
            <div 
              key={result.id}
              onClick={() => handleResultClick(result)}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontSize: '18px' }}>{result.icon}</span>
              <div>
                <div style={{ fontWeight: '600', color: '#1F2937', fontSize: '14px' }}>{result.title}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  {new Date(result.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {token ? (
          <>
            <div
              style={profileTriggerStyle}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div style={avatarStyle}>
                {firstLetter}
              </div>
              <span style={{ fontWeight: '600', color: '#1F2937', fontSize: '15px' }}>
                {userName}
              </span>
              <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '2px', transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </div>

            <div style={dropdownStyle}>
              <div style={{ padding: '10px 16px', fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                {userName}
              </div>
              <div style={{ height: '1px', backgroundColor: '#F3F4F6', margin: '4px 0' }}></div>
              <Link to="/profile" style={{
                display: 'block', textDecoration: 'none', color: '#4B5563',
                padding: '10px 16px', fontSize: '14px', fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={() => setIsMenuOpen(false)}>
                Profilim
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', border: 'none', backgroundColor: 'transparent',
                  padding: '10px 16px', textAlign: 'left', color: '#dc3545',
                  fontWeight: '600', cursor: 'pointer', fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#FFF5F5'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Çıkış Yap
              </button>
            </div>
          </>
        ) : (
          <Link className="btn btn-primary btn-sm rounded-pill px-4" to="/">Giriş Yap</Link>
        )}
      </div>
    </nav>
  );
}

export default Header;