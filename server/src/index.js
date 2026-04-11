require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}))
app.use(express.json())

// Serve downloaded media files
const dataPath   = process.env.DATA_PATH   || path.join(__dirname, '../../../data')
const publicPath = process.env.PUBLIC_PATH || path.join(__dirname, '../../public')

app.use('/media', express.static(dataPath))

// Serve frontend build (hash mode — index.html suffit pour toutes les routes)
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath))
}

// Ensure data directories exist
;['videos', 'photos'].forEach(dir =>
  fs.mkdirSync(path.join(dataPath, dir), { recursive: true })
)

// Routes
app.use('/auth', require('./routes/auth'))
app.use('/api/youtube', require('./routes/youtube'))
app.use('/api/movie', require('./routes/movie'))
app.use('/api/fights', require('./routes/fights'))
app.use('/api/actors', require('./routes/actors'))
app.use('/api/movies', require('./routes/movies'))
app.use('/api/choreographers', require('./routes/choreographers'))
app.use('/api/suggestions',   require('./routes/suggestions'))

// MongoDB
const mongoUri = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@mongo:27017/${process.env.MONGODB_DBNAME}?authSource=admin`
mongoose.connect(mongoUri)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB error:', err.message))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`))
