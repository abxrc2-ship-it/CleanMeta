import express from 'express';
import multer from 'multer';
import { put, del, list } from '@vercel/blob';
import crypto from 'crypto';

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

app.use(express.json());

async function verifyFirebaseToken(authHeader?: string): Promise<{ uid: string; email?: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return null;

  try {
    const apiKey =
      process.env.VITE_FIREBASE_API_KEY ||
      'AIzaSyCSoheNCR1iHSQi5SYleqwM0fvaq8u4TCY';

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    if (data.users && data.users.length > 0) {
      return {
        uid: data.users[0].localId,
        email: data.users[0].email,
      };
    }
  } catch (err) {
    console.error('Server auth verification error:', err);
  }
  return null;
}

app.get('/api/blob/status', (req, res) => {
  const isConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  res.json({
    configured: isConfigured,
    allowance: '1 GB',
    maxFileSize: '25 MB',
  });
});

app.post('/api/blob/upload', upload.single('file'), async (req, res): Promise<void> => {
  const user = await verifyFirebaseToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: Valid Firebase login required.' });
    return;
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    res.status(503).json({
      isUnconfigured: true,
      error: 'Vercel Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel settings.',
    });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file provided.' });
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    res.status(400).json({ error: 'Invalid file MIME type.' });
    return;
  }

  const retention = req.body.retention || '1day';
  let durationMs = 1 * 24 * 60 * 60 * 1000;
  if (retention === '2days') durationMs = 2 * 24 * 60 * 60 * 1000;
  else if (retention === '3days') durationMs = 3 * 24 * 60 * 60 * 1000;
  else if (retention === '4days') durationMs = 4 * 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + durationMs;

  let ext = 'jpg';
  if (file.mimetype === 'image/png') ext = 'png';
  else if (file.mimetype === 'image/webp') ext = 'webp';

  const randomId = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const pathname = `users/${user.uid}/${Date.now()}_${randomId}.${ext}`;

  try {
    const blob = await put(pathname, file.buffer, {
      access: 'public',
      token: blobToken,
      contentType: file.mimetype,
    });

    res.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      expiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upload to Vercel Blob.' });
  }
});

app.post('/api/blob/delete', async (req, res): Promise<void> => {
  const user = await verifyFirebaseToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const { pathname } = req.body;
  if (!pathname || typeof pathname !== 'string') {
    res.status(400).json({ error: 'Pathname is required.' });
    return;
  }

  // Ownership check
  const userPrefix = `users/${user.uid}/`;
  if (!pathname.startsWith(userPrefix)) {
    res.status(403).json({ error: 'Forbidden: You do not own this file.' });
    return;
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    res.status(503).json({ error: 'Blob token not configured.' });
    return;
  }

  try {
    await del(pathname, { token: blobToken });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete blob.' });
  }
});

app.all('/api/blob/cleanup', async (req, res): Promise<void> => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const reqSecret = req.query.secret || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (cronSecret && reqSecret !== cronSecret) {
    res.status(401).json({ error: 'Unauthorized cron trigger.' });
    return;
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    res.status(503).json({ error: 'Blob token not configured.' });
    return;
  }

  try {
    const { blobs } = await list({ token: blobToken, prefix: 'users/' });
    const now = Date.now();
    let deletedCount = 0;

    for (const b of blobs) {
      const parts = b.pathname.split('/');
      if (parts.length >= 3) {
        const filePart = parts[2];
        const timestamp = parseInt(filePart.split('_')[0], 10);
        const maxLife = 7 * 24 * 60 * 60 * 1000;
        if (!isNaN(timestamp) && now - timestamp > maxLife) {
          await del(b.pathname, { token: blobToken });
          deletedCount++;
        }
      }
    }

    res.json({ success: true, deletedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Cleanup error.' });
  }
});

export default app;
