const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'aes-256-cbc';
const getEncryptionKey = () => {
  return crypto.scryptSync(process.env.JWT_SECRET || 'fallback-secret', 'salt', 32);
};

exports.encryptFile = (filePath) => {
  const key = getEncryptionKey();
  const fileBuffer = fs.readFileSync(filePath);
  // Generate a strictly unique IV for EVERY file
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  // Prepend the unencrypted IV to the encrypted data (standard practice)
  const encrypted = Buffer.concat([iv, cipher.update(fileBuffer), cipher.final()]);
  const encryptedPath = `${filePath}.enc`;
  
  fs.writeFileSync(encryptedPath, encrypted);
  return encryptedPath;
};

exports.decryptFile = (encryptedBuffer) => {
  // Extract the original 16-byte IV from the front of the buffer
  const ivFromBuffer = encryptedBuffer.slice(0, 16);
  const encryptedData = encryptedBuffer.slice(16);
  const key = getEncryptionKey();
  
  const decipher = crypto.createDecipheriv(algorithm, key, ivFromBuffer);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  
  return decrypted;
};
