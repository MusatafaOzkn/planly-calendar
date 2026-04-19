#  İş Planlama ve Etkinlik Takvimi (Business Calendar)

Modern, minimalist ve kullanıcı dostu bir iş yönetim ve takvim uygulaması. Bu proje, günlük iş akışınızı yönetmenize, etkinliklerinizi planlamanıza ve iş yükünüzü görselleştirmenize yardımcı olmak için tasarlanmıştır.

## + Özellikler

- **Gelişmiş Takvim Görünümü:** Günlük, haftalık ve aylık iş planlama.
- **İş Yönetimi:** Yeni iş ekleme, düzenleme, silme ve detay görüntüleme.
- **Dolu/Boş Takibi:** Günlük iş yükünüze göre otomatik değişen durum göstergeleri.
- **Hızlı Özet:** "Bugün" paneli ile o günün işlerini anlık görme.
- **Dinamik Renkler:** İşlerin durumuna göre sade ve şık görsel geri bildirimler.
- **Responsive Tasarım:** Mobil ve masaüstü cihazlarla tam uyumlu.

## + Teknoloji Yığını

- **Frontend:** React, Tailwind CSS, Axios, Lucide Icons
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Kimlik Doğrulama:** JSON Web Token 
- **Tarih Yönetimi:** Day.js / Moment.js

## + Dış API Servisleri
### 1-Resmi Tatiller (Nager.Date API):
- https://date.nager.at/ ==> Türkiye'deki ulusal bayramları ve resmi tatilleri çekmek için kullanılır.
### 2-Dini Bayramlar (Aladhan Hijri Calendar API):
- https://aladhan.com/rest-api ==> Ramazan ve Kurban bayramı gibi dini özel günlerin tarihlerini (Diyanet metoduna göre) hesaplamak için kullanılır.

  

# Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

### 1. Depoyu Klonlayın
```bash
git https://github.com/MusatafaOzkn/planly-calendar.git
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
```
backend klasörü içinde bir .env dosyası oluşturun ve .env.example içindeki değişkenleri kendinize göre doldurun:
``bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/takvim_veritabani
JWT_SECRET=gizli_anahtariniz
``

### Backend'i başlatın:
```bash
npm run dev
```

### 3. Frontend Kurulumu
```bash
cd ../frontend
npm install
```
 frontend klasörü içinde bir .env dosyası oluşturun:
```bash
REACT_APP_API_URL=http://localhost:5000/api
```
Frontend'i başlatın:
```bash
npm start
```

## + Bilinen Sorunlar ve Çözümleri
Eğer proje çalıştığında ekranda **Module not found: Error: Can't resolve 'jwt-decode'** hastası alıyorsanız veya buna benzer başka bir hata aşağıdaki adımları uygulayın:
```bash
cd frontend
npm install jwt-decode
```

## + Proje Yapısı

Projenin dosya ve klasör hiyerarşisi aşağıdadır:
```bash
calendar/
├── backend/                    # Node.js & Express Sunucusu
│   ├── src/
│   │   ├── app.js              # Sunucu yapılandırması & Giriş noktası
│   │   ├── controllers/        # İş mantığı (eventController.js vb.)
│   │   ├── middleware/         # Yetkilendirme (auth.js - JWT)
│   │   ├── models/             # Veritabanı şemaları (User, Event)
│   │   └── routes/             # API uç noktaları (users, events)
│   ├── .env.example            # Örnek çevre değişkenleri
│   ├── Dockerfile              # Backend için Docker yapılandırması
│   └── package.json            # Backend bağımlılıkları
├── frontend/                   # React Uygulaması
│   ├── src/
│   │   ├── components/         # Arayüz bileşenleri (EventList, Header, Today vb.)
│   │   ├── config/             # Uygulama genel ayarları (brandConfig.js)
│   │   ├── services/           # API servisleri (Axios/api.js)
│   │   ├── App.js              # Ana uygulama bileşeni
│   │   ├── index.css           # Global tasarım ve stil kodları
│   │   └── index.js            # React giriş noktası
│   ├── public/                 # Statik dosyalar
│   ├── .env.example            # Frontend-Backend bağlantı ayarları
│   ├── Dockerfile              # Frontend için Docker yapılandırması
│   └── package.json            # Frontend bağımlılıkları
├── .gitignore                  # Git dışı bırakılacak dosyalar
├── docker-compose.yml          # Çoklu konteyner (App + DB) kurulumu
└── README.md                   # Proje dökümantasyonu
```

## + Lisans
Bu proje ücretsiz olarak kullanılabilir ve geliştirilebilir ama teşekkür etmek zorunludur. ☺️



















