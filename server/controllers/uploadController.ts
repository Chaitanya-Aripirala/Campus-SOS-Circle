import { Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { AuthenticatedRequest } from '../middleware/auth';

// Lazy configure Cloudinary
function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return cloudinary;
  }
  return null;
}

export async function uploadImage(req: AuthenticatedRequest, res: Response) {
  try {
    const file = req.file;

    if (!file) {
      // Check if base64 provided in body
      if (req.body.imageBase64) {
        return res.json({
          success: true,
          url: req.body.imageBase64,
          storage: 'inline',
        });
      }
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Image size exceeds 5MB limit' });
    }

    // Try uploading to Cloudinary via SDK
    const cld = getCloudinary();
    if (cld) {
      try {
        const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const uploadStream = cld.uploader.upload_stream(
            {
              folder: 'campus_sos',
              resource_type: 'image',
            },
            (err, result) => {
              if (err || !result) return reject(err || new Error('Upload failed'));
              resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });

        return res.json({
          success: true,
          url: uploadResult.secure_url,
          storage: 'cloudinary',
          publicId: uploadResult.public_id,
        });
      } catch (cloudErr) {
        console.warn('[Upload] Cloudinary SDK upload error, using embedded fallback:', (cloudErr as Error).message);
      }
    }

    // High performance embedded fallback: base64 data URI
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return res.json({
      success: true,
      url: dataUrl,
      storage: 'embedded',
      filename: file.originalname,
      size: file.size,
    });
  } catch (error) {
    console.error('[Upload] Image upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process image upload' });
  }
}
