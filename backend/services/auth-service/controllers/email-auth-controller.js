const authService = require('../auth-service');
const logger = require('../../../shared/utils/logger');

const registerWithEmail = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['email', 'password'] 
      });
    }

    // Create user in Auth0 and our database
    const { user, tokens } = await authService.handleEmailRegistration({
      email,
      password,
      name: name || email.split('@')[0], // Use email username if no name provided
    });

    res.json({ user, tokens });
  } catch (error) {
    logger.error('Email registration error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details
    });
    
    if (error.message?.includes('already exists')) {
      return res.status(409).json({ 
        error: 'Email already registered',
        message: 'Please try logging in instead'
      });
    }

    res.status(500).json({ 
      error: 'Registration failed', 
      message: 'An unexpected error occurred during registration'
    });
  }
};

const loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['email', 'password'] 
      });
    }

    // Authenticate user and generate tokens
    const { user, tokens } = await authService.handleEmailLogin(email, password);

    res.json({ user, tokens });
  } catch (error) {
    logger.error('Email login error:', error);
    
    if (error.message?.includes('invalid credentials')) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'No account exists with this email address'
      });
    }

    res.status(500).json({ 
      error: 'Login failed', 
      message: 'An unexpected error occurred during login'
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required'
      });
    }

    await authService.initiatePasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({ 
      message: 'If an account exists with this email, you will receive password reset instructions'
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    // Still return success to prevent email enumeration
    res.json({ 
      message: 'If an account exists with this email, you will receive password reset instructions'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['token', 'newPassword']
      });
    }

    await authService.resetPassword(token, newPassword);
    res.json({ message: 'Password successfully reset' });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(400).json({ 
      error: 'Password reset failed',
      message: 'Invalid or expired reset token'
    });
  }
};

module.exports = {
  registerWithEmail,
  loginWithEmail,
  forgotPassword,
  resetPassword
}; 