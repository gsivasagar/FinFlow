const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    const db = getDB();

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const userRole = role || 'viewer';

    const stmt = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(name, email, hashedPassword, userRole);

    res.status(201).json({
      message: 'User registered successfully.',
      userId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function login(req, res) {
  try {
    const { email, password } = req.body;

    const db = getDB();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive. Contact an administrator.' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Login successful.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, currency: user.currency || 'USD' }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });
  res.json({ message: 'Logged out successfully.' });
}

function me(req, res) {
  try {
    const db = getDB();
    const user = db.prepare('SELECT id, name, email, role, status, currency FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive.' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

const crypto = require('crypto');

function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const db = getDB();
    
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
      // Return 200 even if user doesn't exist to prevent email enumeration
      return res.json({ message: 'If the email exists, a password reset link has been generated.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?')
      .run(resetToken, resetTokenExpiry, user.id);

    // In a real app, send an email via nodemailer here.
    // For this demonstration, we'll log the token to the console so we can use it, 
    // and return it conditionally only if in non-production mode for easy testing.
    console.log(`[DEV ONLY] Reset token for ${email}: ${resetToken}`);

    res.json({ 
      message: 'If the email exists, a password reset link has been generated.',
      ...(process.env.NODE_ENV !== 'production' && { devNoteToken: resetToken })
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    const db = getDB();

    const user = db.prepare('SELECT id, reset_token_expiry FROM users WHERE reset_token = ?').get(token);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?')
      .run(hashedPassword, user.id);

    res.json({ message: 'Password has been successfully reset. You may now login via the new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function updateProfile(req, res) {
  try {
    const { name, currency } = req.body;
    const db = getDB();
    
    let query = 'UPDATE users SET name = ?';
    let params = [name];
    
    if (currency) {
      query += ', currency = ?';
      params.push(currency);
    }
    
    query += ' WHERE id = ?';
    params.push(req.user.id);
    
    db.prepare(query).run(...params);
    res.json({ message: 'Profile updated successfully.', name, currency });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = getDB();
    
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    const isValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ error: 'Incorrect current password.' });

    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(newPassword, salt);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { register, login, logout, me, forgotPassword, resetPassword, updateProfile, updatePassword };
