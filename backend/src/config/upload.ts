import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const uploadsBase = path.join(__dirname, '../../uploads');
ensureDir(uploadsBase);

const makeStorage = (subdir: string) => {
  const dir = path.join(uploadsBase, subdir);
  ensureDir(dir);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || `.${file.mimetype.split('/')[1]}`;
      const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      cb(null, name);
    },
  });
};

export const upload = multer({
  storage: makeStorage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

export const uploadMedia = multer({
  storage: makeStorage('social'),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only images, videos, and audio files are allowed'));
  },
});

export const uploadStory = multer({
  storage: makeStorage('stories'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only images and short videos are allowed'));
  },
});

export const uploadAvatar = multer({
  storage: makeStorage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

export const uploadServiceImage = multer({
  storage: makeStorage('services'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

export const uploadStoreImage = multer({
  storage: makeStorage('stores'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

export const deleteFile = (filePath: string) => {
  if (!filePath || filePath.startsWith('http') || filePath.startsWith('data:')) return;
  if (filePath.includes('..') || filePath.includes('\\')) return;
  const fullPath = filePath.startsWith('/uploads/')
    ? path.join(uploadsBase, '..', filePath)
    : filePath;
  fs.unlink(fullPath, () => {});
};
