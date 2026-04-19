import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

const CustomScroll = ({ className = '', children, ...props }) => {
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  const handleScroll = (e) => {
    setActive(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(false), 800);
    if (props.onScroll) props.onScroll(e);
  };

  return (
    <div
      className={`${className} ${active ? 'thumb-active' : ''}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onScroll={handleScroll}
      {...props}
    >
      {children}
    </div>
  );
};

function EventList() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const newDate = new Date(dateParam);
      if (!isNaN(newDate.getTime())) {
        setCurrentDate(newDate);
        // O günü modalda aç
        setClickedDateObj(newDate);
        setIsDayModalOpen(true);
      }
    }
  }, [searchParams]);
  const [view, setView] = useState('month');

  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [clickedDateObj, setClickedDateObj] = useState(null);

  const [newEvent, setNewEvent] = useState({ title: '', time: '12:00', endTime: '13:00', description: '', color: 'blue' });
  const [longEvent, setLongEvent] = useState({ title: '', startDate: '', startTime: '09:00', endDate: '', endTime: '18:00', description: '', color: 'purple' });
  const [creationMode, setCreationMode] = useState('daily'); // 'daily' veya 'longterm'
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [checkedEventIds, setCheckedEventIds] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const eventColors = [
    { id: 'blue', bg: '#E0E7FF', text: '#3730A3', border: '#818CF8' },
    { id: 'red', bg: '#FEE2E2', text: '#991B1B', border: '#F87171' },
    { id: 'green', bg: '#DCFCE7', text: '#166534', border: '#4ADE80' },
    { id: 'yellow', bg: '#FEF9C3', text: '#854D0E', border: '#FACC15' },
    { id: 'purple', bg: '#F3E8FF', text: '#5B21B6', border: '#C084FC' },
    { id: 'orange', bg: '#FFEDD5', text: '#9A3412', border: '#FB923C' },
    { id: 'holiday', bg: '#FCE7F3', text: '#BE185D', border: '#F472B6' }, // Tatiller için özel renk
  ];

  const getEventTheme = (colorId) => {
    const found = eventColors.find(c => c.id === colorId);
    return found || eventColors[0];
  };

  const fetchEvents = () => {
    api.get('/events')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setEvents(res.data);
        } else {
          console.error("Beklenen dizi formatı gelmedi:", res.data);
          setEvents([]);
        }
      })
      .catch((err) => {
        console.error("Veri çekme hatası:", err);
        setEvents([]);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getCustomHolidays = (year) => {
    // Paskalya hesaplama (Meeus/Jones/Butcher algoritması)
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    const easterStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return [
      { date: easterStr, localName: 'Paskalya Bayramı', name: 'Easter' }
    ];
  };

  // Tatilleri çeken API Entragrasyonu + Dini Bayramlar
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const year = currentDate.getFullYear();
        let apiHolidays = [];
        let islamicHolidays = [];

        // 1. Resmi Tatiller (Nager.Date)
        try {
          const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/TR`);
          if (res.ok) {
            apiHolidays = await res.json();
          }
        } catch (e) { }

        // 2. Dini Bayramlar (Aladhan API - Diyanet Method 13)
        try {
          const res = await fetch(`https://api.aladhan.com/v1/calendarByCity/${year}?city=Istanbul&country=Turkey&method=13`);
          if (res.ok) {
            const result = await res.json();
            const data = result.data;
            const mappedHolidays = [];

            // Tüm ayları (1-12) tara
            Object.keys(data).forEach(monthKey => {
              data[monthKey].forEach(dayObj => {
                const hList = dayObj.date.hijri.holidays || [];
                if (hList.length > 0) {
                  hList.forEach(hName => {
                    const [d, m, y] = dayObj.date.gregorian.date.split('-');
                    const dateStr = `${y}-${m}-${d}`;

                    if (hName === 'Eid-ul-Fitr') {
                      // Bayram 1. Gün
                      mappedHolidays.push({ date: dateStr, localName: 'Ramazan Bayramı (1)', name: 'Eid al-Fitr' });
                      
                      // 2. ve 3. günleri manuel ekleyelim (API sadece ilk günü verir)
                      const d2 = new Date(y, m - 1, parseInt(d) + 1);
                      const d3 = new Date(y, m - 1, parseInt(d) + 2);
                      
                      mappedHolidays.push({ 
                        date: `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`, 
                        localName: 'Ramazan Bayramı (2)', name: 'Eid al-Fitr' 
                      });
                      mappedHolidays.push({ 
                        date: `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}-${String(d3.getDate()).padStart(2, '0')}`, 
                        localName: 'Ramazan Bayramı (3)', name: 'Eid al-Fitr' 
                      });

                    } else if (hName === 'Eid-ul-Adha') {
                      // Bayram 1. Gün
                      mappedHolidays.push({ date: dateStr, localName: 'Kurban Bayramı (1)', name: 'Eid al-Adha' });
                      
                      // 2. 3. ve 4. günleri manuel ekleyelim
                      for (let i = 1; i <= 3; i++) {
                        const nextD = new Date(y, m - 1, parseInt(d) + i);
                        mappedHolidays.push({ 
                          date: `${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, '0')}-${String(nextD.getDate()).padStart(2, '0')}`, 
                          localName: `Kurban Bayramı (${i + 1})`, name: 'Eid al-Adha' 
                        });
                      }
                    }
                  });
                }
              });
            });
            islamicHolidays = mappedHolidays;
          }
        } catch (e) { console.error("Aladhan fetch error:", e); }

        // Sabit listemizi çek
        const customHolidays = getCustomHolidays(year);

        // Hepsini birleştir (Mükerrer kontrolü yapılabilir ama bayramlar çakışmaz genelde)
        setHolidays([...apiHolidays, ...customHolidays, ...islamicHolidays]);
      } catch (err) {
        console.error("Tatil API hatası:", err);
      }
    };
    fetchHolidays();
  }, [currentDate.getFullYear()]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthDays = [];
  for (let i = 0; i < startDay; i++) monthDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) monthDays.push(new Date(year, month, i));

  // --- Date objesini doğrudan manüpile etmemek için kopya kullanıyoruz ---
  const currentDayOfWeek = currentDate.getDay();
  const diffToMonday = currentDate.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1);
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(diffToMonday);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  const formatDateForDB = (dateObj) => {
    if (!dateObj) return null;
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getEventsForDay = (dateObj) => {
    if (!dateObj) return [];
    
    // Hedef günün yerel tarih damgasını al (saatsiz)
    const targetTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();

    const dbEvents = (Array.isArray(events) ? events : []).filter(evt => {
      const s = new Date(evt.startDate || evt.date);
      const e = new Date(evt.endDate || evt.startDate || evt.date);
      
      // Başlangıç ve bitiş tarihlerini yerel gün bazında al (saatsiz)
      const startTime = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
      const endTime = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();

      // Hedef gün bu aralıkta mı?
      return targetTime >= startTime && targetTime <= endTime;
    }).sort((a, b) => new Date(a.startDate || a.date) - new Date(b.startDate || b.date));

    const formattedTargetDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const dayHolidays = holidays.filter(h => h.date === formattedTargetDate).map(h => ({
      _id: h.name,
      title: h.localName,
      date: new Date(h.date).toISOString(),
      description: '🇹🇷 Resmi Tatil',
      color: 'holiday',
      isHoliday: true
    }));

    return [...dayHolidays, ...dbEvents];
  };

  const renderEventTime = (evt, dateObj) => {
    if (!dateObj || evt.isHoliday) return null;
    
    const start = new Date(evt.startDate || evt.date);
    const end = new Date(evt.endDate || evt.startDate || evt.date);
    const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    
    const sDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const eDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    // Aynı gün içindeyse (Daily veya tek günlük plan)
    if (sDay === eDay && target === sDay) {
      const sStr = start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const eStr = end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      return sStr === eStr ? sStr : `${sStr} - ${eStr}`;
    }

    // Farklı günler (Multi-day)
    // Sadece başlangıç günüyse başlangıç saatini dön
    if (target === sDay) {
      return start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    // Sadece bitiş günüyse bitiş saatini dön
    if (target === eDay) {
      return end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    // Ara günlerde saat gösterme
    return '';
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
      newDate.setDate(1); // Bir sonraki/önceki ayın 1'ine gitmesi istenmişti
    }
    if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    if (view === 'day') newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
      newDate.setDate(1); // Bir sonraki/önceki ayın 1'ine gitmesini sağlıyoruz
    }
    if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    if (view === 'day') newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  // --- DİNAMİK BAŞLIK METNİ ---
  let headerPrefix = '';
  let headerDateText = '';
  const today = new Date();

  if (view === 'month') {
    headerDateText = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    if (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) {
      headerPrefix = 'Bu Ay,';
    }
  } else if (view === 'week') {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const startStr = startOfWeek.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const endStr = endOfWeek.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    headerDateText = `${startStr} - ${endStr}`;

    // Check if current week
    const diffToTodayMonday = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1);
    const todayStartOfWeek = new Date(new Date(today).setDate(diffToTodayMonday));
    if (startOfWeek.toDateString() === todayStartOfWeek.toDateString()) {
      headerPrefix = 'Bu Hafta,';
    }
  } else if (view === 'day') {
    headerDateText = currentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    if (currentDate.toDateString() === today.toDateString()) {
      headerPrefix = 'Bugün,';
    }
  }

  const openDayManager = (dateObj) => {
    if (dateObj) {
      setClickedDateObj(dateObj);
      const dateStr = formatDateForDB(dateObj);
      setNewEvent({ title: '', time: '12:00', endTime: '13:00', description: '', color: 'blue' });
      setLongEvent({ title: '', startDate: dateStr, startTime: '09:00', endDate: dateStr, endTime: '18:00', description: '', color: 'purple' });
      setCreationMode('daily'); // Her açılışta günlüğe sıfırla
      setIsEditing(false);
      setEditingEventId(null);
      setCheckedEventIds([]);
      setIsDeleteMode(false);
      setViewingEvent(null);
      setIsDayModalOpen(true);
    }
  };

  const enterEditMode = (evt) => {
    if (!evt || evt.isHoliday) return;
    
    setIsEditing(true);
    setEditingEventId(evt._id);
    
    const start = new Date(evt.startDate || evt.date);
    const end = new Date(evt.endDate || evt.startDate || evt.date);
    
    // Günlük mü yoksa Uzun Vadeli mi olduğunu anla
    const isMultiDay = start.toDateString() !== end.toDateString();
    
    if (isMultiDay) {
      setCreationMode('longterm');
      setLongEvent({
        title: evt.title,
        startDate: formatDateForDB(start),
        startTime: start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        endDate: formatDateForDB(end),
        endTime: end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        description: evt.description || '',
        color: evt.color || 'purple'
      });
    } else {
      setCreationMode('daily');
      setNewEvent({
        title: evt.title,
        time: start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        endTime: end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        description: evt.description || '',
        color: evt.color || 'blue'
      });
    }
    
    setViewingEvent(null); // Formu göstermek için detay panelini kapat
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    try {
      const startStr = formatDateForDB(clickedDateObj);
      const [sYear, sMonth, sDay] = startStr.split('-');
      
      let payload = {};
      
      if (creationMode === 'daily') {
        const [hour, min] = newEvent.time.split(':');
        const [eHour, eMin] = newEvent.endTime.split(':');
        
        const localDate = new Date(parseInt(sYear), parseInt(sMonth) - 1, parseInt(sDay), parseInt(hour), parseInt(min));
        const endLocalDate = new Date(parseInt(sYear), parseInt(sMonth) - 1, parseInt(sDay), parseInt(eHour), parseInt(eMin));
        
        if (isNaN(localDate.getTime())) throw new Error("Başlangıç tarihi geçersiz.");
        if (isNaN(endLocalDate.getTime())) throw new Error("Bitiş tarihi geçersiz.");
        if (endLocalDate < localDate) throw new Error("Bitiş saati başlangıçtan önce olamaz.");

        payload = {
          title: newEvent.title,
          date: localDate.toISOString(),
          startDate: localDate.toISOString(),
          endDate: endLocalDate.toISOString(),
          description: newEvent.description,
          color: newEvent.color
        };
      } else {
        if (!longEvent.startDate) throw new Error("Lütfen başlangıç tarihini seçin.");
        if (!longEvent.endDate) throw new Error("Lütfen bitiş tarihini seçin.");

        const [lsYear, lsMonth, lsDay] = longEvent.startDate.split('-');
        const [sHour, sMin] = longEvent.startTime.split(':');
        const startDateObj = new Date(parseInt(lsYear), parseInt(lsMonth) - 1, parseInt(lsDay), parseInt(sHour), parseInt(sMin));
        
        const [leYear, leMonth, leDay] = longEvent.endDate.split('-');
        const [eHour, eMin] = longEvent.endTime.split(':');
        const endDateObj = new Date(parseInt(leYear), parseInt(leMonth) - 1, parseInt(leDay), parseInt(eHour), parseInt(eMin));
        
        if (isNaN(startDateObj.getTime())) throw new Error("Başlangıç tarihi geçersiz.");
        if (isNaN(endDateObj.getTime())) throw new Error("Bitiş tarihi geçersiz.");
        if (endDateObj < startDateObj) throw new Error("Bitiş tarihi başlangıçtan önce olamaz.");
        
        payload = {
          title: longEvent.title,
          startDate: startDateObj.toISOString(),
          endDate: endDateObj.toISOString(),
          description: longEvent.description,
          color: longEvent.color
        };
      }

      console.log("Sending payload:", payload);

      const apiCall = isEditing 
        ? api.put(`/events/${editingEventId}`, payload)
        : api.post('/events', payload);

      apiCall
        .then(() => {
          setNewEvent({ title: '', time: '12:00', endTime: '13:00', description: '', color: 'blue' });
          setLongEvent({ title: '', startDate: startStr, startTime: '09:00', endDate: startStr, endTime: '18:00', description: '', color: 'purple' });
          setIsDayModalOpen(false); // Kayıttan sonra pencereyi kapat
          setIsEditing(false);
          setEditingEventId(null);
          fetchEvents();
        })
        .catch((err) => {
          const errMsg = err.response?.data?.error || err.message;
          alert('Hata oluştu: ' + errMsg + ' ❌');
          console.error("Hata:", err);
        });
    } catch (err) {
      alert('Hata: ' + err.message + ' ❌');
    }
  };

  const toggleCheckbox = (id) => {
    setCheckedEventIds(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const confirmDeleteSelected = () => {
    if (checkedEventIds.length > 0) setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    try {
      await Promise.all(checkedEventIds.map(id => api.delete(`/events/${id}`)));
      setCheckedEventIds([]);
      setShowDeleteConfirm(false);
      setIsDeleteMode(false);
      setViewingEvent(null);
      fetchEvents();
    } catch (err) {
      console.error("Çoklu silme hatası:", err);
    }
  };

  const modalEvents = clickedDateObj ? getEventsForDay(clickedDateObj) : [];
  const detailTheme = viewingEvent ? getEventTheme(viewingEvent.color) : null;

  return (
    <div className="container mt-4">
      <style>
        {`
          @keyframes fadeBackdrop { from { opacity: 0; } to { opacity: 1; } }
          @keyframes popUp { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
          .modal-backdrop-anim { animation: fadeBackdrop 0.2s ease-out forwards; }
          .modal-content-anim { animation: popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
          
          /* Custom Scrollbar */
          .custom-scrollbar {
            overscroll-behavior: contain; /* Sayfa kaydırmasını engeller (Scroll chaining) */
          }
          .custom-scrollbar::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          /* Varsayılan olarak thumb görünmez ama render edilir */
          .custom-scrollbar::-webkit-scrollbar-thumb { 
            background-color: rgba(203, 213, 225, 0); 
            border-radius: 10px; 
          }
          /* Alanın üzerine geldiğimizde scrollbar anında görünsün (transition webkit hatalarını önler) */
          .custom-scrollbar.thumb-active::-webkit-scrollbar-thumb { background-color: rgba(203, 213, 225, 1); }
          .custom-scrollbar.thumb-active::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 1); }
        `}
      </style>

      {/* ÜST BÖLÜM */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div style={{ flex: 1 }}>
          <h2 className="mb-0 fw-bold" style={{ color: '#1F2937' }}>Etkinlik Düzenle</h2>
        </div>

        <div className="d-flex justify-content-center" style={{ flex: 1 }}>
          <div className="btn-group" role="group" style={{ backgroundColor: '#F3F4F6', borderRadius: '20px', padding: '4px' }}>
            <button
              className={`btn btn-sm ${view === 'month' ? 'btn-primary shadow-sm' : 'btn-light'}`}
              style={{ borderRadius: '18px', padding: '6px 20px', fontWeight: '600', border: 'none', backgroundColor: view === 'month' ? '#007bff' : 'transparent', color: view === 'month' ? '#fff' : '#6B7280' }}
              onClick={() => setView('month')}
            >Ay</button>
            <button
              className={`btn btn-sm ${view === 'week' ? 'btn-primary shadow-sm' : 'btn-light'}`}
              style={{ borderRadius: '18px', padding: '6px 20px', fontWeight: '600', border: 'none', backgroundColor: view === 'week' ? '#007bff' : 'transparent', color: view === 'week' ? '#fff' : '#6B7280' }}
              onClick={() => setView('week')}
            >Hafta</button>
            <button
              className={`btn btn-sm ${view === 'day' ? 'btn-primary shadow-sm' : 'btn-light'}`}
              style={{ borderRadius: '18px', padding: '6px 20px', fontWeight: '600', border: 'none', backgroundColor: view === 'day' ? '#007bff' : 'transparent', color: view === 'day' ? '#fff' : '#6B7280' }}
              onClick={() => setView('day')}
            >Gün</button>
          </div>
        </div>

        <div className="d-flex justify-content-end align-items-center" style={{ flex: 1 }}>
          <div className="d-flex align-items-center shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '4px' }}>
            <button className="btn btn-sm border-0 text-secondary" onClick={handlePrev} style={{ padding: '4px 12px', fontSize: '16px' }}>&lt;</button>
            <div
              className="px-1 text-center d-flex align-items-center justify-content-center"
              style={{ width: '250px', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: '#374151' }}
              onClick={handleToday}
            >
              {headerPrefix && <span style={{ color: '#9CA3AF', fontWeight: '400', marginRight: '4px' }}>{headerPrefix}</span>}
              <span className="text-truncate">{headerDateText}</span>
            </div>
            <button className="btn btn-sm border-0 text-secondary" onClick={handleNext} style={{ padding: '4px 12px', fontSize: '16px' }}>&gt;</button>
          </div>
        </div>
      </div>

      {/* TAKVİM ALANI */}
      <div className="bg-white rounded shadow-sm border overflow-hidden">
        {/* AY GÖRÜNÜMÜ */}
        {view === 'month' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                <div key={d} className="text-center py-3 fw-bold text-secondary" style={{ fontSize: '14px' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {monthDays.map((dateObj, index) => {
                const dayEvents = dateObj ? getEventsForDay(dateObj) : [];
                const isWeekend = dateObj && (dateObj.getDay() === 0 || dateObj.getDay() === 6);
                const isToday = dateObj && (dateObj.toDateString() === new Date().toDateString());
                const baseBg = !dateObj ? '#F9FAFB' : (isWeekend ? '#F8FAFC' : '#ffffff');
                return (
                  <div key={index} onClick={() => openDayManager(dateObj)}
                    style={{ minWidth: 0, height: '130px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', padding: '8px', backgroundColor: baseBg, cursor: dateObj ? 'pointer' : 'default', transition: 'background-color 0.2s' }}
                    onMouseOver={(e) => dateObj && (e.currentTarget.style.backgroundColor = '#E0F2FE')}
                    onMouseOut={(e) => dateObj && (e.currentTarget.style.backgroundColor = baseBg)}
                  >
                    {dateObj && (
                      <div className="mb-1">
                        {dayEvents.filter(e => e.isHoliday).length > 0 ? (
                          <div style={{ display: 'flex', margin: '-8px -8px 4px -8px', alignItems: 'center', backgroundColor: '#FFF1F2', color: '#881337', padding: '4px 8px', overflow: 'hidden', borderBottom: isToday ? '3px solid #E11D48' : '1px solid #FFE4E6' }} title={dayEvents.find(e => e.isHoliday).title}>
                            <span style={{ fontWeight: '700', marginRight: '6px', fontSize: '14px', color: '#111827', flexShrink: 0 }}>{dateObj.getDate()}</span>
                            <span style={{ width: '6px', height: '6px', backgroundColor: '#E11D48', borderRadius: '50%', marginRight: '5px', flexShrink: 0 }}></span>
                            <span style={{ fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1 }}>{dayEvents.find(e => e.isHoliday).title}</span>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-between align-items-center">
                            <span style={isToday ? { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', backgroundColor: '#007bff', color: '#ffffff', borderRadius: '50%', fontWeight: 'bold', fontSize: '13px' } : { fontWeight: '700', color: isWeekend ? '#9CA3AF' : '#4B5563', fontSize: '14px' }}>
                              {dateObj.getDate()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <CustomScroll className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                      {dayEvents.filter(e => !e.isHoliday).map(evt => {
                        const theme = getEventTheme(evt.color);
                        return (
                          <div key={evt._id} onClick={(e) => { e.stopPropagation(); openDayManager(dateObj); }}
                            style={{
                              position: 'relative', zIndex: 10,
                              backgroundColor: theme.bg, color: theme.text, borderLeft: `3px solid ${theme.border}`,
                              padding: '4px 6px', borderRadius: '4px', fontSize: '12px', marginBottom: '4px',
                              cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: '500'
                            }}
                          >
                            <span style={{ opacity: 0.7, marginRight: '4px' }}>
                              {renderEventTime(evt, dateObj)}
                            </span>
                            {evt.title}
                          </div>
                        )
                      })}
                    </CustomScroll>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HAFTA GÖRÜNÜMÜ */}
        {view === 'week' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {weekDays.map((dateObj, index) => {
              const dayEvents = getEventsForDay(dateObj);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
              const isToday = dateObj.toDateString() === new Date().toDateString();
              const baseBg = isWeekend ? '#F8FAFC' : '#ffffff';
              return (
                <div key={index} onClick={() => openDayManager(dateObj)} style={{ minWidth: 0, minHeight: '400px', borderRight: '1px solid #F3F4F6', padding: '12px', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex', flexDirection: 'column', backgroundColor: baseBg }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E0F2FE'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = baseBg}
                >
                  <div className="text-center mb-3">
                    {dayEvents.filter(e => e.isHoliday).length > 0 ? (
                      <div style={{ margin: '-12px -12px 12px -12px', padding: '10px 12px', backgroundColor: '#FFF1F2', color: '#881337', borderBottom: isToday ? '3px solid #E11D48' : '1px solid #FFE4E6', display: 'flex', flexDirection: 'column', alignItems: 'center' }} title={dayEvents.find(e => e.isHoliday).title}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#9F1239' }}>
                          {dateObj.toLocaleDateString('tr-TR', { weekday: 'short' })}
                        </div>
                        <span className="fw-bold fs-4 m-0 lh-1" style={{ color: '#111827', marginTop: '4px' }}>{dateObj.getDate()}</span>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px', width: '100%', justifyContent: 'center' }}>
                          <span style={{ width: '6px', height: '6px', backgroundColor: '#E11D48', borderRadius: '50%', marginRight: '5px', flexShrink: 0 }}></span>
                          <span style={{ fontSize: '11px', fontWeight: '600', textAlign: 'center', lineHeight: '1.2', flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dayEvents.find(e => e.isHoliday).title}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: isWeekend ? '#9CA3AF' : '#6B7280' }}>
                          {dateObj.toLocaleDateString('tr-TR', { weekday: 'short' })}
                        </div>
                        <div className="fw-bold fs-4 d-flex flex-column align-items-center justify-content-center gap-1" style={{ color: isToday ? '#007bff' : '#1F2937', marginTop: '4px' }}>
                          {isToday ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', backgroundColor: '#007bff', color: '#ffffff', borderRadius: '50%', fontSize: '18px' }}>
                              {dateObj.getDate()}
                            </div>
                          ) : dateObj.getDate()}
                        </div>
                      </>
                    )}
                  </div>
                  <CustomScroll className="custom-scrollbar flex-grow-1" style={{ overflowY: 'auto', minHeight: 0 }}>
                    {dayEvents.filter(e => !e.isHoliday).map(evt => {
                      const theme = getEventTheme(evt.color);
                      return (
                        <div key={evt._id} onClick={(e) => { e.stopPropagation(); openDayManager(dateObj); }}
                          style={{
                            position: 'relative', zIndex: 10,
                            backgroundColor: theme.bg, color: theme.text, borderLeft: `4px solid ${theme.border}`,
                            padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', cursor: 'pointer'
                          }}
                        >
                          <strong style={{ fontSize: '11px', opacity: 0.8 }}>
                            {renderEventTime(evt, dateObj) ? `🕒 ${renderEventTime(evt, dateObj)}` : '🕒 Sürüyor...'}
                          </strong><br />
                          <span style={{ fontWeight: '600' }}>{evt.title}</span>
                        </div>
                      )
                    })}
                  </CustomScroll>
                </div>
              );
            })}
          </div>
        )}

        {/* GÜN GÖRÜNÜMÜ */}
        {view === 'day' && (
          <div className="p-4" style={{ minHeight: '400px' }}>
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
              <h4 style={{ color: '#1F2937', fontWeight: 'bold', margin: 0 }}>{headerDateText} Etkinlikleri</h4>
              <button className="btn btn-primary btn-sm rounded-pill px-3" onClick={() => openDayManager(currentDate)}>
                📅 Günü Yönet (Ekle/İncele)
              </button>
            </div>
            {getEventsForDay(currentDate).length > 0 ? (
              getEventsForDay(currentDate).map(evt => {
                const theme = getEventTheme(evt.color);
                return (
                  <div key={evt._id} className="card mb-3 shadow-sm border-0" onClick={() => openDayManager(currentDate)} style={{ cursor: 'pointer', backgroundColor: theme.bg, borderLeft: `5px solid ${theme.border}!important` }}>
                    <div className="card-body p-4" style={{ borderLeft: `5px solid ${theme.border}`, borderRadius: '4px' }}>
                      <h5 className="card-title fw-bold" style={{ color: theme.text }}>{evt.title}</h5>
                      {!evt.isHoliday && (
                        <h6 className="card-subtitle mb-3" style={{ color: theme.text, opacity: 0.8 }}>
                          🕒 {renderEventTime(evt, currentDate) || 'Tüm Gün'}
                        </h6>
                      )}
                      <p className="card-text" style={{ color: theme.text, opacity: 0.9 }}>{evt.description || 'Not eklenmemiş.'}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center mt-5">
                <p className="text-muted mb-3" style={{ fontSize: '16px' }}>Bu tarihte planlanmış bir etkinlik bulunmuyor.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =======================================================
          HEPSİ BİR ARADA GÜN YÖNETİCİSİ (DEVASA MODAL) 
          ======================================================= */}
      {isDayModalOpen && clickedDateObj && (
        <div
          className="modal-backdrop-anim"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !showDeleteConfirm) setIsDayModalOpen(false);
          }}
        >
          <div className="bg-white rounded-4 shadow-lg modal-content-anim d-flex flex-column overflow-hidden"
            style={{ width: '1200px', maxWidth: '95%', height: '750px', maxHeight: '95vh' }}>

            <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: '#F9FAFB' }}>
              <h5 className="mb-0 fw-bold" style={{ color: '#1F2937' }}>
                📅 {clickedDateObj.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h5>
              <button className="btn-close" onClick={() => setIsDayModalOpen(false)}></button>
            </div>

            <div className="d-flex flex-grow-1 overflow-hidden">

              {/* --- SOL TARAF: LİSTE VE SİLME --- */}
              <div
                className="p-3 border-end d-flex flex-column"
                style={{ width: viewingEvent ? '40%' : '55%', transition: 'width 0.3s ease', backgroundColor: '#ffffff' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 text-secondary">Mevcut Etkinlikler</h6>
                  {modalEvents.length > 0 && (
                    <button
                      className={`btn btn-sm ${isDeleteMode ? 'btn-secondary' : 'btn-outline-danger'} rounded-pill px-2 py-0`}
                      style={{ fontSize: '12px' }}
                      onClick={() => {
                        setIsDeleteMode(!isDeleteMode);
                        setCheckedEventIds([]);
                        setViewingEvent(null);
                      }}
                    >
                      {isDeleteMode ? 'İptal Vazgeç' : '🚫 İptal Et'}
                    </button>
                  )}
                </div>

                <CustomScroll className="custom-scrollbar flex-grow-1" style={{ overflowY: 'auto', minHeight: 0, paddingRight: '5px' }}>
                  {modalEvents.length > 0 ? (
                    modalEvents.map(evt => {
                      const handleBoxClick = () => {
                        if (isDeleteMode) {
                          if (!evt.isHoliday) toggleCheckbox(evt._id);
                        } else {
                          setViewingEvent(evt);
                        }
                      };

                      const isChecked = checkedEventIds.includes(evt._id);
                      const isViewing = viewingEvent && viewingEvent._id === evt._id;
                      const theme = getEventTheme(evt.color);

                      return (
                        <div
                          key={evt._id}
                          className="p-2 mb-2 border rounded-3 d-flex align-items-center"
                          style={{
                            backgroundColor: isDeleteMode ? (isChecked ? '#FEE2E2' : theme.bg) : (isViewing ? '#EFF6FF' : theme.bg),
                            borderColor: isDeleteMode ? (isChecked ? '#F87171' : theme.border) : (isViewing ? '#6366F1' : theme.border),
                            borderLeft: `4px solid ${theme.border}`,
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            boxShadow: isViewing ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
                            opacity: (isDeleteMode && evt.isHoliday) ? 0.6 : 1
                          }}
                          onClick={handleBoxClick}
                        >
                          {isDeleteMode && !evt.isHoliday && (
                            <input
                              type="checkbox"
                              className="form-check-input me-2"
                              style={{ cursor: 'pointer', marginTop: 0 }}
                              checked={isChecked}
                              readOnly
                            />
                          )}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div className="text-truncate" style={{ color: theme.text, fontWeight: 'bold', fontSize: '14px' }}>{evt.title}</div>
                            {!evt.isHoliday && (
                              <div className="fw-semibold" style={{ color: theme.text, opacity: 0.8, fontSize: '12px' }}>
                                🕒 {(() => {
                                  const start = new Date(evt.startDate || evt.date);
                                  const end = new Date(evt.endDate || evt.startDate || evt.date);
                                  const sStr = start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                  const eStr = end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                  return sStr === eStr ? sStr : `${sStr} - ${eStr}`;
                                })()}
                              </div>
                            )}
                          </div>
                          {!isDeleteMode && (
                            <div className="ms-1" style={{ color: theme.text, opacity: 0.6, fontSize: '12px' }}>
                              {isViewing ? '👁️' : '❯'}
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-center">
                      <div className="text-muted small">
                        <div style={{ fontSize: '24px', marginBottom: '5px' }}>📭</div>
                        <p className="mb-0">Etkinlik bulunmuyor.</p>
                      </div>
                    </div>
                  )}
                </CustomScroll>

                {isDeleteMode && checkedEventIds.length > 0 && (
                  <div className="mt-2 pt-2 border-top">
                    <button
                      className="btn btn-danger btn-sm w-100 fw-bold rounded-pill"
                      onClick={confirmDeleteSelected}
                    >
                      🗑️ Sil ({checkedEventIds.length})
                    </button>
                  </div>
                )}
              </div>

              {/* --- SAĞ TARAF: DETAY veya YENİ EKLE --- */}
              <div
                className="d-flex flex-column"
                style={{ width: viewingEvent ? '60%' : '45%', transition: 'width 0.3s ease', backgroundColor: '#FAFAFA' }}
              >
                <CustomScroll className="custom-scrollbar flex-grow-1 p-4" style={{ overflowY: 'auto', minHeight: 0 }}>

                  {viewingEvent && detailTheme ? (
                    /* 1. DURUM: ETKİNLİK DETAYI EKRANI (Minimalist Beyaz Kart) */
                    <div className="d-flex flex-column h-100">
                      <h6 className="fw-bold mb-3 text-secondary d-flex align-items-center">
                        <span className="me-2">📑</span> Detaylar
                      </h6>

                      <div className="bg-white p-4 rounded-3 border mb-3 flex-grow-1 d-flex flex-column shadow-sm" style={{ borderTop: `4px solid ${detailTheme.border}` }}>
                        <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom" style={{ wordBreak: 'break-word' }}>
                          {viewingEvent.title}
                        </h5>

                        {!viewingEvent.isHoliday && (
                          <div className="mb-4 d-flex align-items-center bg-light p-2 rounded border">
                            <span className="fs-4 me-3 ms-2">🕒</span>
                            <div className="d-flex flex-wrap gap-3">
                              <div>
                                <div className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Başlangıç</div>
                                <div className="fw-bold text-dark fs-6">
                                  {new Date(viewingEvent.startDate || viewingEvent.date).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              {(viewingEvent.startDate && viewingEvent.endDate && new Date(viewingEvent.startDate).toISOString() !== new Date(viewingEvent.endDate).toISOString()) && (
                                <>
                                  <div style={{ width: '1px', backgroundColor: '#E5E7EB' }}></div>
                                  <div>
                                    <div className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Bitiş</div>
                                    <div className="fw-bold text-dark fs-6">
                                      {new Date(viewingEvent.endDate).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex-grow-1 d-flex flex-column">
                          <div className="text-muted mb-2" style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Açıklama / Notlar</div>
                          <div className="p-3 rounded bg-light flex-grow-1 text-dark" style={{ fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1px solid #E5E7EB', lineHeight: '1.6' }}>
                            {viewingEvent.description || <span className="text-muted fst-italic">Bu etkinlik için herhangi bir not girilmemiş.</span>}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-2 border-top d-flex gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm rounded-pill py-2 shadow-sm flex-grow-1 fw-bold"
                          onClick={() => enterEditMode(viewingEvent)}
                        >
                          ✏️ Düzenle
                        </button>
                        <button
                          className="btn btn-primary btn-sm rounded-pill py-2 shadow-sm flex-grow-1 fw-bold"
                          onClick={() => setViewingEvent(null)}
                        >
                          + Yeni Ekle
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 2. DURUM: YENİ ETKİNLİK EKLEME FORMU */
                    <div className="d-flex flex-column h-100">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0 text-primary">
                          {isEditing ? '✏️ Etkinliği Düzenle' : '+ Yeni Etkinlik Ekle'}
                        </h6>
                        {isEditing && (
                          <button 
                            className="btn btn-link btn-sm text-muted text-decoration-none fw-bold" 
                            onClick={() => {
                              setIsEditing(false);
                              setEditingEventId(null);
                              setViewingEvent(null); // Formdan çıkıp gün detayına döner
                            }}
                          >Vazgeç</button>
                        )}
                      </div>

                      <div className="mb-4 p-1 d-flex bg-white rounded-pill border shadow-sm" style={{ width: 'fit-content' }}>
                        <button 
                          className={`btn btn-sm rounded-pill px-3 fw-bold ${creationMode === 'daily' ? 'btn-primary shadow-sm' : 'border-0 text-muted'}`}
                          onClick={() => !isEditing && setCreationMode('daily')}
                          disabled={isEditing}
                          style={{ transition: 'all 0.2s', cursor: isEditing ? 'not-allowed' : 'pointer' }}
                        >Günlük Ekleme</button>
                        <button 
                          className={`btn btn-sm rounded-pill px-3 fw-bold ${creationMode === 'longterm' ? 'btn-primary shadow-sm' : 'border-0 text-muted'}`}
                          onClick={() => !isEditing && setCreationMode('longterm')}
                          disabled={isEditing}
                          style={{ transition: 'all 0.2s', cursor: isEditing ? 'not-allowed' : 'pointer' }}
                        >Uzun Vadeli Plan</button>
                      </div>

                      <form onSubmit={handleAddSubmit} className="d-flex flex-column flex-grow-1">
                        {creationMode === 'daily' ? (
                          <>
                            <div className="mb-3">
                              <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Başlık</label>
                              <input
                                type="text"
                                className="form-control form-control-sm bg-white border"
                                placeholder="Örn: Proje Sunumu"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                required
                              />
                            </div>

                            <div className="row g-2 mb-3">
                              <div className="col-6">
                                <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Başlangıç Saati</label>
                                <input
                                  type="time"
                                  className="form-control form-control-sm bg-white border"
                                  value={newEvent.time}
                                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="col-6">
                                <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Bitiş Saati</label>
                                <input
                                  type="time"
                                  className="form-control form-control-sm bg-white border"
                                  value={newEvent.endTime}
                                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                  required
                                />
                              </div>
                            </div>

                            <div className="mb-3">
                              <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Renk Seç</label>
                              <div className="d-flex gap-2">
                                {eventColors.slice(0, 6).map(color => (
                                  <div
                                    key={color.id}
                                    onClick={() => setNewEvent({ ...newEvent, color: color.id })}
                                    style={{
                                      width: '24px', height: '24px', borderRadius: '50%',
                                      backgroundColor: color.border, cursor: 'pointer',
                                      border: newEvent.color === color.id ? '2px solid #1F2937' : '2px solid transparent',
                                      boxShadow: newEvent.color === color.id ? '0 0 0 2px #fff inset' : 'none'
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-3">
                              <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Plan Başlığı</label>
                              <input
                                type="text"
                                className="form-control form-control-sm bg-white border"
                                placeholder="Örn: Tatil veya İş Seyahati"
                                value={longEvent.title}
                                onChange={(e) => setLongEvent({ ...longEvent, title: e.target.value })}
                                required
                              />
                            </div>

                            <div className="row g-2 mb-3">
                              <div className="col-8">
                                <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Başlangıç Tarihi</label>
                                <input
                                  type="date"
                                  className="form-control form-control-sm bg-white border"
                                  value={longEvent.startDate}
                                  onChange={(e) => setLongEvent({ ...longEvent, startDate: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="col-4">
                                <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Saat</label>
                                <input
                                  type="time"
                                  className="form-control form-control-sm bg-white border"
                                  value={longEvent.startTime}
                                  onChange={(e) => setLongEvent({ ...longEvent, startTime: e.target.value })}
                                  required
                                />
                              </div>
                            </div>

                            <div className="row g-2 mb-3">
                              <div className="col-8">
                                <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Bitiş Tarihi</label>
                                <input
                                  type="date"
                                  className="form-control form-control-sm bg-white border"
                                  value={longEvent.endDate}
                                  onChange={(e) => setLongEvent({ ...longEvent, endDate: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="col-4">
                                <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Saat</label>
                                <input
                                  type="time"
                                  className="form-control form-control-sm bg-white border"
                                  value={longEvent.endTime}
                                  onChange={(e) => setLongEvent({ ...longEvent, endTime: e.target.value })}
                                  required
                                />
                              </div>
                            </div>

                            <div className="mb-3">
                              <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Renk Seç</label>
                              <div className="d-flex gap-2">
                                {eventColors.slice(0, 6).map(color => (
                                  <div
                                    key={color.id}
                                    onClick={() => setLongEvent({ ...longEvent, color: color.id })}
                                    style={{
                                      width: '24px', height: '24px', borderRadius: '50%',
                                      backgroundColor: color.border, cursor: 'pointer',
                                      border: longEvent.color === color.id ? '2px solid #1F2937' : '2px solid transparent',
                                      boxShadow: longEvent.color === color.id ? '0 0 0 2px #fff inset' : 'none'
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        <div className="mb-3 flex-grow-1">
                          <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '12px' }}>Notlar / Açıklama</label>
                          <textarea
                            className="form-control form-control-sm bg-white border"
                            rows="3"
                            placeholder="Opsiyonel detaylar..."
                            value={creationMode === 'daily' ? newEvent.description : longEvent.description}
                            onChange={(e) => creationMode === 'daily' ? setNewEvent({ ...newEvent, description: e.target.value }) : setLongEvent({ ...longEvent, description: e.target.value })}
                            style={{ resize: 'none' }}
                          />
                        </div>

                        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold rounded-pill shadow-sm">
                          💾 {isEditing ? 'Güncellemeleri Kaydet' : (creationMode === 'daily' ? 'Günlük Ekle' : 'Planı Kaydet')}
                        </button>
                      </form>
                    </div>
                  )}
                </CustomScroll>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ÖZEL SİLME ONAY MODALI */}
      {showDeleteConfirm && (
        <div
          className="modal-backdrop-anim"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060 }}
        >
          <div className="bg-white p-4 rounded-4 shadow-lg modal-content-anim text-center" style={{ width: '350px', maxWidth: '90%' }}>
            <div className="mb-2" style={{ fontSize: '30px' }}>⚠️</div>
            <h6 className="fw-bold mb-2" style={{ color: '#DC2626' }}>Etkinlikleri Sil</h6>
            <p className="text-secondary small mb-4">
              Seçmiş olduğunuz <strong>{checkedEventIds.length}</strong> etkinliği kalıcı olarak silmek istediğinize emin misiniz?
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button className="btn btn-light btn-sm rounded-pill px-3 fw-semibold" onClick={() => setShowDeleteConfirm(false)}>Vazgeç</button>
              <button className="btn btn-danger btn-sm rounded-pill px-3 fw-semibold" onClick={executeDelete}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default EventList;