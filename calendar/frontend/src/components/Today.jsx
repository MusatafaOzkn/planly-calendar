import React, { useState, useEffect, useRef } from 'react';
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

function Today() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingEvent, setViewingEvent] = useState(null);

  // Ekleme/Düzenleme Durumları
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [creationMode, setCreationMode] = useState('daily');

  // Form Durumları
  const [newEvent, setNewEvent] = useState({ title: '', time: '12:00', endTime: '13:00', description: '', color: 'blue' });
  const [longEvent, setLongEvent] = useState({ title: '', startDate: '', startTime: '09:00', endDate: '', endTime: '18:00', description: '', color: 'purple' });

  // Silme Durumu
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [checkedEventIds, setCheckedEventIds] = useState([]);

  const eventColors = [
    { id: 'blue', bg: '#E0E7FF', text: '#3730A3', border: '#818CF8' },
    { id: 'red', bg: '#FEE2E2', text: '#991B1B', border: '#F87171' },
    { id: 'green', bg: '#DCFCE7', text: '#166534', border: '#4ADE80' },
    { id: 'yellow', bg: '#FEF9C3', text: '#854D0E', border: '#FACC15' },
    { id: 'purple', bg: '#F3E8FF', text: '#5B21B6', border: '#C084FC' },
    { id: 'orange', bg: '#FFEDD5', text: '#9A3412', border: '#FB923C' },
    { id: 'holiday', bg: '#FCE7F3', text: '#BE185D', border: '#F472B6' },
  ];

  const getEventTheme = (colorId) => {
    const found = eventColors.find(c => c.id === colorId);
    return found || eventColors[0];
  };

  useEffect(() => {
    fetchTodayEvents();
    const todayStr = new Date().toISOString().split('T')[0];
    setLongEvent(prev => ({ ...prev, startDate: todayStr, endDate: todayStr }));
  }, []);

  const fetchTodayEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();
      const filtered = res.data.filter(evt => {
        const start = new Date(evt.startDate || evt.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(evt.endDate || evt.startDate || evt.date);
        end.setHours(0, 0, 0, 0);
        return todayTime >= start.getTime() && todayTime <= end.getTime();
      });
      setEvents(filtered);
    } catch (err) {
      console.error("Bugün verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const today = new Date();
      const [ty, tm, td] = [today.getFullYear(), today.getMonth() + 1, today.getDate()];
      let payload = {};
      if (creationMode === 'daily') {
        const [hour, min] = newEvent.time.split(':');
        const [eHour, eMin] = newEvent.endTime.split(':');
        const startObj = new Date(ty, tm - 1, td, parseInt(hour), parseInt(min));
        const endObj = new Date(ty, tm - 1, td, parseInt(eHour), parseInt(eMin));
        if (endObj < startObj) throw new Error("Bitiş saati başlangıçtan önce olamaz.");
        payload = { title: newEvent.title, date: startObj.toISOString(), startDate: startObj.toISOString(), endDate: endObj.toISOString(), description: newEvent.description, color: newEvent.color };
      } else {
        const [lsYear, lsMonth, lsDay] = longEvent.startDate.split('-');
        const [leYear, leMonth, leDay] = longEvent.endDate.split('-');
        const [sh, sm] = longEvent.startTime.split(':');
        const [eh, em] = longEvent.endTime.split(':');
        const startObj = new Date(parseInt(lsYear), parseInt(lsMonth) - 1, parseInt(lsDay), parseInt(sh), parseInt(sm));
        const endObj = new Date(parseInt(leYear), parseInt(leMonth) - 1, parseInt(leDay), parseInt(eh), parseInt(em));
        if (endObj < startObj) throw new Error("Bitiş tarihi başlangıçtan önce olamaz.");
        payload = { title: longEvent.title, startDate: startObj.toISOString(), endDate: endObj.toISOString(), description: longEvent.description, color: longEvent.color };
      }
      const apiCall = isEditing ? api.put(`/events/${editingEventId}`, payload) : api.post('/events', payload);
      await apiCall;
      // Cleanup
      setNewEvent({ title: '', time: '12:00', endTime: '13:00', description: '', color: 'blue' });
      const todayStr = new Date().toISOString().split('T')[0];
      setLongEvent({ title: '', startDate: todayStr, startTime: '09:00', endDate: todayStr, endTime: '18:00', description: '', color: 'purple' });
      setIsEditing(false);
      setIsAdding(false);
      setEditingEventId(null);
      setViewingEvent(null);
      fetchTodayEvents();
    } catch (err) { alert("Hata: " + err.message); }
  };

  const confirmDeleteSelected = async () => {
    if (window.confirm(`${checkedEventIds.length} etkinliği silmek istediğinize emin misiniz?`)) {
      try {
        await Promise.all(checkedEventIds.map(id => api.delete(`/events/${id}`)));
        setIsDeleteMode(false);
        setCheckedEventIds([]);
        fetchTodayEvents();
        setViewingEvent(null);
      } catch (err) { alert("Silme hatası: " + err.message); }
    }
  };

  const enterEditMode = (evt) => {
    setIsEditing(true);
    setEditingEventId(evt._id);
    const start = new Date(evt.startDate || evt.date);
    const end = new Date(evt.endDate || evt.startDate || evt.date);
    const isMultiDay = start.toDateString() !== end.toDateString();
    if (isMultiDay) {
      setCreationMode('longterm');
      setLongEvent({ title: evt.title, startDate: start.toISOString().split('T')[0], startTime: start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), endDate: end.toISOString().split('T')[0], endTime: end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), description: evt.description || '', color: evt.color || 'purple' });
    } else {
      setCreationMode('daily');
      setNewEvent({ title: evt.title, time: start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), endTime: end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), description: evt.description || '', color: evt.color || 'blue' });
    }
    setViewingEvent(null);
  };

  const renderEventTime = (evt) => {
    if (evt.isHoliday) return "Resmi Tatil";
    const start = new Date(evt.startDate || evt.date);
    const end = new Date(evt.endDate || evt.startDate || evt.date);
    const sStr = start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const eStr = end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return sStr === eStr ? sStr : `${sStr} - ${eStr}`;
  };

  const todayStr = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const showSidePanel = isEditing || isAdding || viewingEvent;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F9FAFB' }}>
      {/* HEADER */}
      <div className="p-4 bg-white border-bottom d-flex justify-content-between align-items-center shadow-sm">
        <div>
          <h2 className="mb-0 fw-bold" style={{ color: '#111827' }}>Bugün</h2>
          <div className="text-secondary small fw-medium">{todayStr}</div>
        </div>
        <div className="d-flex gap-2">
          {!isEditing && !viewingEvent && (
            <button
              className={`btn ${isAdding ? 'btn-secondary' : 'btn-primary'} rounded-pill px-4 fw-bold shadow-sm transition-all`}
              onClick={() => {
                setViewingEvent(null);
                setIsEditing(false);
                setIsAdding(!isAdding);
              }}
            >
              {isAdding ? 'Vazgeç' : '+ Hızlı Ekle'}
            </button>
          )}
          <button className={`btn btn-sm rounded-pill px-3 ${isDeleteMode ? 'btn-secondary' : 'btn-outline-danger'}`} onClick={() => { setIsDeleteMode(!isDeleteMode); setCheckedEventIds([]); setViewingEvent(null); setIsAdding(false); }}>{isDeleteMode ? 'İptal' : '🗑️ Sil'}</button>
        </div>
      </div>

      <div className="d-flex flex-grow-1 overflow-hidden" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        {/* LEFT PANEL: LIST */}
        <div
          className="border-end d-flex flex-column bg-white shadow-sm"
          style={{
            width: showSidePanel ? '450px' : '100%',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: 1
          }}
        >
          <CustomScroll className="flex-grow-1 p-3">
            {loading ? (
              <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : events.length > 0 ? (
              events.map(evt => {
                const theme = getEventTheme(evt.color);
                const isSelected = (viewingEvent && viewingEvent._id === evt._id) || (editingEventId === evt._id && isEditing);
                const isChecked = checkedEventIds.includes(evt._id);
                return (
                  <div key={evt._id} className="p-3 mb-3 rounded-4 border d-flex align-items-center"
                    style={{
                      backgroundColor: isSelected ? '#EFF6FF' : theme.bg,
                      borderColor: isSelected ? '#3B82F6' : theme.border,
                      borderLeft: `6px solid ${theme.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                    }}
                    onClick={() => {
                      if (isDeleteMode) {
                        setCheckedEventIds(prev => prev.includes(evt._id) ? prev.filter(id => id !== evt._id) : [...prev, evt._id]);
                      } else {
                        setViewingEvent(evt);
                        setIsEditing(false);
                        setIsAdding(false);
                      }
                    }}>
                    {isDeleteMode && <input type="checkbox" className="form-check-input me-3" checked={isChecked} readOnly />}
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="fw-bold text-truncate" style={{ fontSize: '15px', color: '#111827' }}>{evt.title}</div>
                      <div className="small fw-semibold mt-1" style={{ color: theme.text, opacity: 0.8 }}>🕒 {renderEventTime(evt)}</div>
                    </div>
                    {!isDeleteMode && <div className="ms-2 text-muted">❯</div>}
                  </div>
                );
              })
            ) : (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-5">
                <div style={{ fontSize: '60px', opacity: 0.6 }}>☕</div>
                <div className="mt-2 fw-bold text-secondary">Bugünlük başka plan yok.</div>
                <button className="btn btn-link text-primary fw-bold text-decoration-none mt-2" onClick={() => setIsAdding(true)}>İlkini sen ekle</button>
              </div>
            )}
          </CustomScroll>
          {isDeleteMode && checkedEventIds.length > 0 && (
            <div className="p-3 border-top"><button className="btn btn-danger w-100 rounded-pill fw-bold" onClick={confirmDeleteSelected}>Seçilenleri Sil ({checkedEventIds.length})</button></div>
          )}
        </div>

        {/* RIGHT PANEL: DETAIL / FORM */}
        {showSidePanel && (
          <div
            className="flex-grow-1 bg-light d-flex flex-column h-100 overflow-hidden shadow-inner"
            style={{
              animation: 'slideIn 0.3s ease-out',
              borderLeft: '1px solid #E5E7EB'
            }}
          >
            <CustomScroll className="p-4 h-100">
              {isEditing ? (
                /* EDIT FORM */
                <div className="bg-white p-4 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '600px' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0 text-primary">✏️ Etkinliği Düzenle</h5>
                    <button className="btn btn-link btn-sm text-muted text-decoration-none fw-bold" onClick={() => { setIsEditing(false); setViewingEvent(null); }}>Kapat</button>
                  </div>
                  <form onSubmit={handleAddSubmit}>
                    <div className="mb-3"><label className="form-label text-secondary fw-semibold small">BAŞLIK</label>
                      <input type="text" className="form-control border-0 bg-light p-3" value={creationMode === 'daily' ? newEvent.title : longEvent.title} onChange={(e) => creationMode === 'daily' ? setNewEvent({ ...newEvent, title: e.target.value }) : setLongEvent({ ...longEvent, title: e.target.value })} required /></div>
                    <div className="row g-3 mb-4">
                      {creationMode === 'daily' ? (
                        <>
                          <div className="col-6"><label className="form-label text-secondary fw-semibold small">BAŞLANGIÇ SAATİ</label><input type="time" className="form-control border-0 bg-light p-3" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} required /></div>
                          <div className="col-6"><label className="form-label text-secondary fw-semibold small">BİTİŞ SAATİ</label><input type="time" className="form-control border-0 bg-light p-3" value={newEvent.endTime} onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })} required /></div>
                        </>
                      ) : (
                        <>
                          <div className="col-6"><label className="form-label text-secondary fw-semibold small">BAŞLANGIÇ</label><input type="date" className="form-control border-0 bg-light p-3" value={longEvent.startDate} onChange={(e) => setLongEvent({ ...longEvent, startDate: e.target.value })} required /><input type="time" className="form-control border-0 bg-light p-3 mt-2" value={longEvent.startTime} onChange={(e) => setLongEvent({ ...longEvent, startTime: e.target.value })} required /></div>
                          <div className="col-6"><label className="form-label text-secondary fw-semibold small">BİTİŞ</label><input type="date" className="form-control border-0 bg-light p-3" value={longEvent.endDate} onChange={(e) => setLongEvent({ ...longEvent, endDate: e.target.value })} required /><input type="time" className="form-control border-0 bg-light p-3 mt-2" value={longEvent.endTime} onChange={(e) => setLongEvent({ ...longEvent, endTime: e.target.value })} required /></div>
                        </>
                      )}
                    </div>
                    <div className="mb-4"><label className="form-label text-secondary fw-semibold small">RENK</label>
                      <div className="d-flex gap-2">
                        {eventColors.slice(0, 6).map(c => (
                          <div key={c.id} onClick={() => creationMode === 'daily' ? setNewEvent({ ...newEvent, color: c.id }) : setLongEvent({ ...longEvent, color: c.id })}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c.border, cursor: 'pointer', border: (creationMode === 'daily' ? newEvent.color : longEvent.color) === c.id ? '3px solid #111827' : 'none' }}></div>
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100 p-3 rounded-pill fw-bold shadow-sm">Güncellemeyi Kaydet</button>
                  </form>
                </div>
              ) : viewingEvent ? (
                /* DETAIL VIEW */
                <div className="bg-white p-5 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '600px' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: getEventTheme(viewingEvent.color).bg, color: getEventTheme(viewingEvent.color).text }}>{viewingEvent.isHoliday ? 'Resmi Tatil' : 'Etkinlik'}</span>
                    <button className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold" onClick={() => enterEditMode(viewingEvent)}>✏️ Düzenle</button>
                  </div>
                  <h2 className="fw-bold mb-4" style={{ color: '#111827' }}>{viewingEvent.title}</h2>
                  <div className="d-flex align-items-center gap-2 mb-4 text-secondary fw-medium bg-light p-3 rounded-3"><span>🕒</span> {renderEventTime(viewingEvent)}</div>
                  <div className="p-4 rounded-4 bg-light text-dark shadow-inner mb-4" style={{ minHeight: '150px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{viewingEvent.description || "Açıklama belirtilmemiş."}</div>
                  <button className="btn btn-dark w-100 rounded-pill fw-bold" onClick={() => setViewingEvent(null)}>Kapat</button>
                </div>
              ) : isAdding && (
                /* NEW ADD FORM */
                <div className="bg-white p-4 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '600px' }}>
                  <h5 className="fw-bold mb-4 text-primary">+ Yeni Etkinlik Ekle</h5>
                  <div className="d-flex gap-2 mb-4 bg-light p-1 rounded-pill">
                    <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${creationMode === 'daily' ? 'btn-primary' : 'text-muted'}`} onClick={() => setCreationMode('daily')}>Bugün İçin</button>
                    <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${creationMode === 'longterm' ? 'btn-primary' : 'text-muted'}`} onClick={() => setCreationMode('longterm')}>Uzun Vadeli</button>
                  </div>
                  <form onSubmit={handleAddSubmit}>
                    <div className="mb-3"><input type="text" className="form-control border-0 bg-light p-3" placeholder="Bugün ne yapacaksın?" value={creationMode === 'daily' ? newEvent.title : longEvent.title} onChange={(e) => creationMode === 'daily' ? setNewEvent({ ...newEvent, title: e.target.value }) : setLongEvent({ ...longEvent, title: e.target.value })} required /></div>
                    <div className="row g-2 mb-4">
                      <div className="col-6"><label className="form-label text-secondary fw-semibold small">BAŞLANGIÇ SAATİ</label><input type="time" className="form-control border-0 bg-light p-3" value={creationMode === 'daily' ? newEvent.time : longEvent.startTime} onChange={(e) => creationMode === 'daily' ? setNewEvent({ ...newEvent, time: e.target.value }) : setLongEvent({ ...longEvent, startTime: e.target.value })} required /></div>
                      <div className="col-6"><label className="form-label text-secondary fw-semibold small">BİTİŞ SAATİ</label><input type="time" className="form-control border-0 bg-light p-3" value={creationMode === 'daily' ? newEvent.endTime : longEvent.endTime} onChange={(e) => creationMode === 'daily' ? setNewEvent({ ...newEvent, endTime: e.target.value }) : setLongEvent({ ...longEvent, endTime: e.target.value })} required /></div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100 p-3 rounded-pill fw-bold shadow-lg">Listeye Ekle</button>
                  </form>
                </div>
              )}
            </CustomScroll>
          </div>
        )}
      </div>

      <style>{`
          @keyframes slideIn {
            from { transform: translateX(30px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
    </div>
  );
}

export default Today;
