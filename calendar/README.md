## 📁 Proje Yapısı

Projenin dosya ve klasör hiyerarşisi aşağıdadır:

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
├── LICENSE                     # MIT Lisansı
└── README.md                   # Proje dökümantasyonu


