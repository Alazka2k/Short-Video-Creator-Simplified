const jwt = require('jsonwebtoken');
const storageService = require('../../shared/utils/storage');

async function mediaAuthMiddleware(req, res, next) {
  try {
    // Get token from request
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user has access to this media
    const mediaKey = req.params.mediaKey;
    const hasAccess = await checkUserMediaAccess(decoded.userId, mediaKey);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate temporary signed URL
    const signedUrl = await storageService.getSignedUrl(mediaKey, 3600);
    res.redirect(signedUrl);

  } catch (error) {
    logger.error('Media access error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
} 