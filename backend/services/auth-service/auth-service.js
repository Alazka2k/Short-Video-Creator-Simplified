// auth-service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authModel = require('./auth-model');
const config = require('../../shared/utils/config');

class AuthService {
  async registerUser(email, password) {
    const existingUser = await authModel.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    const userId = await authModel.createUser(email, password);
    return this.generateToken(userId);
  }

  async loginUser(email, password) {
    const user = await authModel.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    return this.generateToken(user.id);
  }

  generateToken(userId) {
    return jwt.sign({ userId }, config.auth.jwtSecret, { expiresIn: '1h' });
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret);
      const user = await authModel.getUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService();