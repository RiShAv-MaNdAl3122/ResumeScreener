require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const screeningRoutes = require('./routes/screeningRoutes');
const jobsRoutes = require('./routes/jobsRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const candidatesRoutes = require('./routes/candidatesRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory and Candidate-Photos subdirectory exist
const uploadsDir = path.join(__dirname, 'uploads');
const candidatePhotosDir = path.join(__dirname, 'uploads', 'Candidate-Photos');
const uploadsCVsDir = path.join(__dirname, 'uploads', 'CVs');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(candidatePhotosDir)) {
    fs.mkdirSync(candidatePhotosDir, { recursive: true });
}
if (!fs.existsSync(uploadsCVsDir)) {
    fs.mkdirSync(uploadsCVsDir, { recursive: true });
}

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes Registration
app.use('/api', screeningRoutes);
app.use('/api', jobsRoutes);
app.use('/api', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', candidatesRoutes);

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Resume Screener Backend Running"
    });
});

// Error handling fallback
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Meaningful error: Internal server error'
    });
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Node.js Backend server is running on http://localhost:${PORT}`);
});
