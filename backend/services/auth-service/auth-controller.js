// auth-controller.js
const authService = require('./auth-service');

class AuthController {
  async register(req, res) {
    try {
      const { email, password } = req.body;
      const token = await authService.registerUser(email, password);
      res.json({ token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const token = await authService.loginUser(email, password);
      res.json({ token });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async verifyToken(req, res) {
    try {
      const token = req.header('Authorization').replace('Bearer ', '');
      const user = await authService.verifyToken(token);
      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

module.exports = new AuthController();