import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch (err) {
        console.error('Profil yükleme hatası:', err);
        setError('Profil bilgileri yüklenemedi.');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Profil yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Hata Oluştu</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
        <header className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kullanıcı Profili</h1>
            <p className="text-gray-500 mt-2 text-lg">Hesap bilgilerinizi buradan görüntüleyebilirsiniz.</p>
        </header>
        
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/50">
            <div className="p-10">
                <div className="flex flex-col md:flex-row items-center gap-10 mb-12 pb-12 border-b border-gray-50">
                    <div className="relative">
                        <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-200 rotate-3">
                            <span className="-rotate-3">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold text-gray-900">{user.name}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                            <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100">
                                🛡️ Standart Kullanıcı
                            </span>
                            <span className="px-4 py-1.5 bg-gray-50 text-gray-500 rounded-full text-sm font-medium border border-gray-100">
                                ID: {user._id.substring(0, 8)}...
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="group p-6 bg-gray-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/20 transition-all">
                        <label className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 block">Tam İsim</label>
                        <p className="text-xl font-bold text-gray-800">{user.name}</p>
                    </div>
                    <div className="group p-6 bg-gray-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/20 transition-all">
                        <label className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 block">E-posta Adresi</label>
                        <p className="text-xl font-bold text-gray-800">{user.email}</p>
                    </div>
                    <div className="group p-6 bg-gray-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/20 transition-all">
                        <label className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 block">Üyelik Tarihi</label>
                        <p className="text-xl font-bold text-gray-800">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmemiş'}
                        </p>
                    </div>
                    <div className="group p-6 bg-gray-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/20 transition-all">
                        <label className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 block">Hesap Durumu</label>
                        <p className="text-xl font-bold text-gray-800 text-green-600 flex items-center gap-2">
                             <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                             Aktif
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-50/80 p-8 px-10 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-gray-500 text-sm font-medium italic">Bilgileriniz uçtan uca şifrelenmiştir.</p>
                <div className="flex gap-4">
                    <button className="px-8 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-50 transition-all active:scale-95">
                        Şifre Değiştir
                    </button>
                    <button className="px-8 py-3 bg-indigo-600 rounded-2xl font-bold text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95">
                        Düzenle
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}

export default Profile;
