
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

// File filter for allowing only PDFs
const fileFilterConfig = (req, file, cb) => {
	if (file.mimetype === "application/pdf") {
		cb(null, true);
	} else {
		cb(new Error("Only PDF files are allowed!"), false);
	}
};

const upload = multer({
	storage: storageConfig,
	limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
	fileFilter: fileFilterConfig,
});

module.exports = upload;

