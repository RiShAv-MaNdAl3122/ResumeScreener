const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/CVs');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage location and file naming
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Create GUID for unique file naming
        const fileGuid = uuidv4();
        const ext = path.extname(file.originalname);
        const storedName = fileGuid + ext;
        
        // Save the GUID inside req.file so the controller can use it
        file.fileGuid = fileGuid;
        cb(null, storedName);
    }
});

// File filter to allow only PDF and DOCX
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type. Only PDF and DOCX are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Wrapper middleware for safe error handling
const uploadMiddleware = (req, res, next) => {
    const uploadSingle = upload.single('resume');
    
    uploadSingle(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

module.exports = uploadMiddleware;
