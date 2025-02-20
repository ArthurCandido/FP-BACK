
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storageConfig = multer.diskStorage({
	destination: uploadDir,
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});


// file filter for filtering only images
const fileFilterConfig = function(req, file, cb) {
	cb(null, true);
};

const upload = multer({
	storage: storageConfig,
	limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
	fileFilter: fileFilterConfig,
});

module.exports = upload;

