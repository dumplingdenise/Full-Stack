const multer = require("multer");
const path = require("path");

// Set Storage Engine
const storage = multer.diskStorage({
	destination: (req, file, callback) => callback(null, "./public/uploads/" + req.user.id + "/"),
	filename: (req, file, callback) => callback(null, req.user.id + "-" + Date.now() + path.extname(file.originalname))
});

// Check File Type
function checkFileType(file, callback) {
	// Allowed file extensions
	const filetypes = /jpeg|jpg|png|gif/;

	// Test extension
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

	// Test mime
	const mimetype = filetypes.test(file.mimetype);
	if (mimetype && extname) return callback(null, true);
	callback({ message: "Images Only" });
}

// Define Upload Function
const upload = multer({
	storage,
	limits: { fileSize: 1000000 }, // 1MB
	fileFilter: (req, file, callback) => checkFileType(file, callback)
}).single("posterUpload");

module.exports = upload;
