const multer = require("multer");
const path = require("node:path");
let fileNumber = 0;

const storageConfig = multer.diskStorage({
	// destinations is uploads folder 
	// under the project directory
	destination: path.join(__dirname, "uploads"),
	filename: (req, file, res) => {
		// file name is prepended with current time
		// in milliseconds to handle duplicate file names
		res(null, Date.now() + "-" + file.originalname);
	},
});

// file filter for filtering only images
const fileFilterConfig = function(req, file, cb) {
	cb(null, true);
};

// creating multer object for storing
// with configuration
const upload = multer({
	// applying storage and file filter
	storage: storageConfig,
	limits: {
		// limits file size to 5 MB
		fileSize: 1024 * 1024 * 5
	},
	fileFilter: fileFilterConfig,
});

module.exports = upload;
