# Secure REST API

Proyek Secure REST API dengan Node.js, Express, dan PostgreSQL untuk tugas Cloud Computing dan Security. API ini dilengkapi dengan autentikasi berbasis JWT (access + refresh token), hash password menggunakan bcrypt, dan berbagai proteksi keamanan.

## 🚀 Fitur Utama

- ✅ **Autentikasi JWT**: Access token dan refresh token untuk keamanan maksimal
- ✅ **Password Hashing**: Menggunakan bcrypt dengan salt rounds
- ✅ **Security Headers**: Helmet untuk proteksi HTTP headers
- ✅ **Rate Limiting**: Pencegahan brute force attack
- ✅ **CORS**: Konfigurasi Cross-Origin Resource Sharing
- ✅ **Input Validation**: Express-validator untuk validasi input
- ✅ **Logging**: Winston untuk logging yang komprehensif
- ✅ **Docker Support**: Dockerfile dan docker-compose.yml untuk deployment
- ✅ **CI/CD**: GitHub Actions untuk automated testing dan deployment
- ✅ **HTTPS Ready**: Siap untuk deployment di platform cloud dengan HTTPS (Render, Railway)

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 15.0 (atau gunakan cloud database seperti ElephantSQL/Supabase)
- **Docker** (opsional, untuk containerized deployment)
- **npm** atau **yarn**

## 🛠️ Instalasi Lokal

### 1. Clone Repository

```bash
git clone <repository-url>
cd secure-restapi
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy file `.env.example` ke `.env` dan sesuaikan nilai-nilainya:

```bash
cp .env.example .env
```

Edit file `.env` dengan konfigurasi Anda:

```env
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secure_api_db
DB_USER=postgres
DB_PASSWORD=postgres

# Atau gunakan DATABASE_URL untuk cloud database
# DATABASE_URL=postgresql://user:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-too
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_ROUNDS=10
```

### 4. Setup Database

Pastikan PostgreSQL sudah berjalan. Database dan tabel akan dibuat otomatis saat aplikasi pertama kali dijalankan.

### 5. Jalankan Aplikasi

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 🐳 Menggunakan Docker

### 1. Build dan Jalankan dengan Docker Compose

```bash
docker-compose up --build
```

Ini akan menjalankan:

- PostgreSQL database di port 5432
- API server di port 3000

### 2. Jalankan dalam Background

```bash
docker-compose up -d
```

### 3. Stop Services

```bash
docker-compose down
```

### 4. Stop dan Hapus Volumes

```bash
docker-compose down -v
```

## 📡 API Endpoints

### Authentication Endpoints

#### 1. Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### 3. Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. Logout

```http
POST /api/auth/logout
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "message": "Logout successful"
}
```

### Items Endpoints (Protected)

#### 1. Get All Items

```http
GET /api/items
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "name": "Item 1",
      "description": "Description",
      "created_by": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

#### 2. Create Item (Admin Only)

```http
POST /api/items
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "New Item",
  "description": "Item description"
}
```

**Response:**

```json
{
  "message": "Item created successfully",
  "item": {
    "id": 2,
    "name": "New Item",
    "description": "Item description",
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## 🔐 Security Features

### 1. JWT Authentication

- Access token dengan expiry 15 menit
- Refresh token dengan expiry 7 hari
- Refresh token disimpan di database untuk invalidation

### 2. Password Security

- Bcrypt hashing dengan configurable salt rounds
- Password requirements: min 8 karakter, uppercase, lowercase, dan angka

### 3. Rate Limiting

- General API: 100 requests per 15 menit
- Auth endpoints: 5 requests per 15 menit (anti brute-force)

### 4. Security Headers (Helmet)

- Content Security Policy
- XSS Protection
- Frame Options
- HSTS (HTTP Strict Transport Security)

### 5. Input Validation

- Express-validator untuk semua input
- Sanitization dan normalization

### 6. CORS

- Configurable CORS origin
- Credentials support

### 7. Logging

- Winston logger dengan file rotation
- Log semua authentication attempts
- Error logging dengan stack traces

## ☁️ Deployment ke Cloud Platform

### Render

1. Buat account di [Render](https://render.com)
2. Connect repository GitHub Anda
3. Buat PostgreSQL database baru
4. Set environment variables:
   - `DATABASE_URL` (dari Render PostgreSQL)
   - `JWT_SECRET` (generate random string)
   - `JWT_REFRESH_SECRET` (generate random string)
   - `NODE_ENV=production`
   - `PORT` (Render akan set otomatis)
5. Deploy!

HTTPS akan tersedia otomatis di Render.

### Railway

1. Buat account di [Railway](https://railway.app)
2. Connect repository GitHub Anda
3. Tambah PostgreSQL service
4. Set environment variables seperti di atas
5. Deploy!

### ElephantSQL / Supabase

1. Setup database di ElephantSQL atau Supabase
2. Copy connection string ke `DATABASE_URL`
3. Deploy aplikasi ke Render/Railway dengan `DATABASE_URL` yang sudah dikonfigurasi

## 🧪 Testing

### Manual Testing dengan cURL

**Register:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test1234"}'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

**Get Items (dengan token):**

```bash
curl -X GET http://localhost:3000/api/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Create Item (Admin):**

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","description":"Test Description"}'
```

## 📁 Struktur Project

```
secure-restapi/
├── src/
│   ├── config/
│   │   └── logger.js          # Winston logger configuration
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   └── itemController.js   # Items CRUD logic
│   ├── database/
│   │   └── connection.js       # PostgreSQL connection & initialization
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication middleware
│   │   └── validation.js       # Validation error handler
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── RefreshToken.js    # Refresh token model
│   │   └── Item.js             # Item model
│   ├── routes/
│   │   ├── authRoutes.js       # Authentication routes
│   │   └── itemRoutes.js       # Items routes
│   └── server.js               # Express app & server setup
├── logs/                       # Log files (created automatically)
├── .env.example                # Environment variables template
├── .gitignore
├── Dockerfile                  # Docker image configuration
├── docker-compose.yml          # Docker Compose configuration
├── package.json
└── README.md                   # This file
```

## 🔍 Default Admin User

Setelah pertama kali menjalankan aplikasi, default admin user akan dibuat:

- **Email**: `admin@example.com`
- **Password**: `admin123` (atau sesuai `ADMIN_PASSWORD` di env)

**⚠️ PENTING**: Ubah password admin setelah deployment!

## 📝 Scripts

- `npm start` - Jalankan aplikasi (production)
- `npm run dev` - Jalankan dengan nodemon (development)
- `npm run migrate` - Run database migrations
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

### Database Connection Error

- Pastikan PostgreSQL berjalan
- Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` di `.env`
- Untuk cloud database, gunakan `DATABASE_URL`

### Port Already in Use

- Ubah `PORT` di `.env` atau hentikan proses yang menggunakan port tersebut

### JWT Errors

- Pastikan `JWT_SECRET` dan `JWT_REFRESH_SECRET` sudah di-set
- Gunakan string yang kuat dan random untuk production

## 📚 Dokumentasi Tambahan

Lihat file `LAPORAN_TEKNIS.md` untuk dokumentasi lengkap proyek ini.

## 📄 License

MIT License

## 👨‍💻 Author

Dibuat untuk tugas Cloud Computing dan Security

---

**Note**: Pastikan untuk mengubah semua secret keys dan credentials sebelum deployment ke production!
