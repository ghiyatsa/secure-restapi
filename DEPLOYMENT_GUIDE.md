# Panduan Deployment ke Render

## Prerequisites

- GitHub account
- Code sudah di-push ke GitHub repository
- Render account (free tier available)

## Step-by-Step Deployment

### 1. Push Code ke GitHub

```bash
# Jika belum ada git repository
git init
git add .
git commit -m "Initial commit: Secure REST API"

# Buat repository di GitHub, lalu:
git remote add origin https://github.com/username/secure-restapi.git
git branch -M main
git push -u origin main
```

### 2. Setup Database di Render

1. Login ke [Render Dashboard](https://dashboard.render.com)
2. Klik "New" → "PostgreSQL"
3. Isi form:
   - Name: `secure-api-db`
   - Database: `secure_api_db`
   - User: `secure_api_user`
   - Region: Pilih yang terdekat
   - PostgreSQL Version: 15
   - Plan: Free
4. Klik "Create Database"
5. Tunggu sampai database ready
6. Copy **Internal Database URL** atau **External Database URL**

### 3. Deploy Web Service

1. Di Render Dashboard, klik "New" → "Web Service"
2. Connect GitHub repository:
   - Pilih repository `secure-restapi`
   - Klik "Connect"
3. Configure service:
   - Name: `secure-restapi`
   - Region: Pilih yang terdekat
   - Branch: `main`
   - Root Directory: (biarkan kosong)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

### 4. Set Environment Variables

Di bagian "Environment Variables", tambahkan:

| Key                  | Value                                         |
| -------------------- | --------------------------------------------- |
| `DATABASE_URL`       | Paste database URL dari step 2                |
| `NODE_ENV`           | `production`                                  |
| `PORT`               | (biarkan kosong, Render akan set otomatis)    |
| `JWT_SECRET`         | Generate random string (min 32 chars)         |
| `JWT_REFRESH_SECRET` | Generate random string berbeda (min 32 chars) |
| `CORS_ORIGIN`        | `*` atau domain frontend Anda                 |
| `BCRYPT_ROUNDS`      | `10`                                          |

**Generate random strings untuk JWT secrets:**

```bash
# Di terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Deploy

1. Klik "Create Web Service"
2. Tunggu build dan deploy selesai
3. Copy URL yang diberikan (akan seperti: `https://secure-restapi.onrender.com`)

### 6. Test Production

Test semua endpoint di production URL:

```bash
# Health check
curl https://your-app.onrender.com/health

# Login
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### 7. Verify HTTPS

- Pastikan URL menggunakan `https://`
- Test di browser untuk memastikan SSL certificate valid
- Render menyediakan HTTPS gratis secara otomatis

## Troubleshooting

### Build Failed

- Check build logs di Render dashboard
- Pastikan semua dependencies ada di `package.json`
- Pastikan Node.js version compatible (18+)

### Database Connection Error

- Pastikan `DATABASE_URL` sudah di-set dengan benar
- Gunakan **Internal Database URL** untuk connection dari web service
- Pastikan database sudah fully provisioned

### Environment Variables Not Working

- Pastikan semua variables sudah di-set di Render dashboard
- Restart service setelah menambah environment variables
- Check logs untuk melihat error

### Port Error

- Jangan set PORT secara manual
- Render akan secara otomatis assign PORT
- Code sudah handle `process.env.PORT || 3000`

## Production Checklist

- [ ] All environment variables set
- [ ] Database connected
- [ ] HTTPS working
- [ ] All endpoints tested
- [ ] Logs accessible
- [ ] Health check working
- [ ] Admin user created (check logs)

## Monitor Production

1. **Logs**: Check di Render dashboard → Logs tab
2. **Metrics**: Monitor CPU, Memory usage
3. **Alerts**: Setup alerts untuk errors (jika ada)

## Free Tier Limitations

- Web service sleep setelah 15 menit idle
- Database: 90 MB storage
- 750 hours/month free

---

**Congratulations! 🎉 API Anda sudah live di production!**
