import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = isLogin ? '/users/login' : '/users/signup';
    const payload = isLogin ? { email, password } : { name, email, password };

    api.post(endpoint, payload)
      .then((res) => {
        if (isLogin) {
          localStorage.setItem('token', res.data.token);
          setMessage({ type: 'success', text: 'Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...' });
          setTimeout(() => navigate('/events'), 1500);
        } else {
          setMessage({ type: 'success', text: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.' });
          setIsLogin(true);
          setName('');
        }
      })
      .catch((err) => {
        console.error(err);
        const errorText = err.response?.data?.message || (isLogin ? 'Giriş başarısız. Bilgilerinizi kontrol edin.' : 'Kayıt başarısız. Lütfen tekrar deneyin.');
        setMessage({ type: 'error', text: errorText });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-2xl">
        <div className="p-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
            </h1>
            <p className="text-gray-500">
              {isLogin ? 'Takviminize erişmek için giriş yapın.' : 'Planlarınızı organize etmeye hemen başlayın.'}
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-fade-in ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              <span className="text-lg">
                {message.type === 'success' ? '✓' : '⚠'}
              </span>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 ml-1">İsim Soyisim</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Mustafa Yılmaz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 ml-1">E-posta</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 ml-1">Şifre</label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Şifremi Unuttum</button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-200'
              }`}
            >
              {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-600">
              {isLogin ? "Henüz bir hesabınız yok mu?" : 'Zaten bir hesabınız var mı?'}
              <button
                className="ml-2 text-blue-600 hover:text-blue-700 font-bold decoration-blue-200 hover:underline transition-all"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage(null);
                }}
              >
                {isLogin ? 'Kayıt Olun' : 'Giriş Yapın'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
