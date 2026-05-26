const { requireAuth, requireModule } = require('../middleware/auth');

function register(app) {
  app.post('/api/upload/image', requireAuth, requireModule('upload'), async (req, res) => {
    try {
      if (!req.body.image_data) {
        return res.status(400).json({ error: 'image_data_required' });
      }

      const cloudinary = require('../config/cloudinary');
      const result = await cloudinary.uploader.upload(req.body.image_data, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        folder: 'doctors',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ]
      });

      res.json({ url: result.secure_url });
    } catch (e) {
      res.status(500).json({ error: 'upload_failed' });
    }
  });

  app.post('/api/upload/image-base64', requireAuth, requireModule('upload'), async (req, res) => {
    try {
      const { image_data } = req.body;
      if (!image_data) {
        return res.status(400).json({ error: 'image_data_required' });
      }

      const cloudinary = require('../config/cloudinary');
      const result = await cloudinary.uploader.upload(image_data, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ]
      });

      res.json({ url: result.secure_url });
    } catch (e) {
      res.status(500).json({ error: 'upload_failed' });
    }
  });
}

module.exports = { register };
