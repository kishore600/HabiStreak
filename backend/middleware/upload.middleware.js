const multer = require('multer');
const DatauriParser = require('datauri/parser.js');
const path = require('path');

// Set up Multer Storage
const storage = multer.memoryStorage(); // Store image in memory
const upload = multer({ storage });

const parser = new DatauriParser();

const dataUri = (req) => {
  if (!req.file) {
    throw new Error('No file uploaded'); // Handle error for no file
  }
  const ext = path.extname(req.file.originalname).toString(); // Get the file extension
  return parser.format(ext, req.file.buffer); // Return the Data URI
};

const dataUriMultipleFiles = (file) => {
  if (!file) {
    throw new Error('No file uploaded'); 
  }
  const ext = path.extname(file.originalname).toString();
  return parser.format(ext, file.buffer); 
};

module.exports = { dataUri, dataUriMultipleFiles, upload };
