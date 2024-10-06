const authService = require('./auth-service');

async function authMiddleware(req, res, next) {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const user = await authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
}