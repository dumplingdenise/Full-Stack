const multer = require('multer');
const path = require('path');

// Set Storage Engine
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/chats/');
    },
    filename: (req, file, callback) => {
        callback(null, Date.now() +
            path.extname(file.originalname));
    }
});
// Check File Type
function checkFileType(file, callback) {
    // Allowed file extensions
    const filetypes = /jpeg|jpg|png/;
    // Test extension
    const extname =
        filetypes.test(path.extname(file.originalname).toLowerCase());
    // Test mime
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return callback(null, true);
    }
    else {
        callback({ message: 'File type of jpeg, jpg, and png only.' });
    }
}
// Define Upload Function
const chatsImageUpload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB
    fileFilter: (req, file, callback) => {
        checkFileType(file, callback);
    }
});


module.exports = chatsImageUpload;