const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const fs = require('fs');
const fsp = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

// Hàm tính hash MD5 của file từ path
async function getFileHash(filePath) {
  const fileBuffer = await fsp.readFile(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

// Cấu hình multer với disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = 'uploads/';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Created uploads directory: ${uploadsDir}`);
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const hash = crypto.createHash('md5').update(file.originalname).digest('hex');
    const filename = `${hash}-${file.originalname}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
});

// Middleware để xử lý file sau khi upload và kiểm tra trùng lặp
const processUploadedFiles = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const uploadsDir = 'uploads/';
  const files = req.file ? [req.file] : req.files;
  for (const file of files) {
    const existingFiles = await fsp.readdir(uploadsDir).catch(err => []);
    let isDuplicate = false;

    for (const existingFile of existingFiles) {
      const existingFilePath = path.join(uploadsDir, existingFile);
      const existingHash = await getFileHash(existingFilePath).catch(err => null);
      const currentHash = await getFileHash(file.path).catch(err => null);
      if (existingHash === currentHash) {
        console.log(`Reusing existing file: ${existingFile}`);
        if (fs.existsSync(file.path) && existingFile !== file.filename) {
          await fsp.unlink(file.path).catch(err => console.log(`Failed to delete duplicate file ${file.path}:`, err));
        }
        file.path = path.join(uploadsDir, existingFile);
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      console.log(`Saved new file: ${file.filename}`);
    }
  }

  next();
};

router.get('/users/:userAddress', userController.getUser);
router.post('/nft/mint-metadata', upload.array('images'), processUploadedFiles, userController.mintMetadata);
router.put('/nft/:tokenId/update', upload.single('image'), processUploadedFiles, userController.updateNFTMetadata);
router.get('/nft/:tokenId', userController.getNFTMetadata);

module.exports = router;