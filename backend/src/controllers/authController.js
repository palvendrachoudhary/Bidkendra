const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const {
  generateId,
  sendResponse
} = require('../utils/helpers');
const generateToken = (id, role) => {
  return jwt.sign({
    id,
    role
  }, process.env.JWT_SECRET || 'bidverify-sih-2026-super-secret-key-cpcl-petroleum', {
    expiresIn: '30d'
  });
};
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role
    } = req.body;

    // Check if user exists
    const checkUser = (await db.query("SELECT id FROM users WHERE email = $1", [email])).rows[0];
    if (checkUser) {
      return sendResponse(res, 400, false, null, 'User already exists');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = generateId();
    await db.query('INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)', [id, name, email, hashedPassword, role || 'BIDDER']);
    const token = generateToken(id, role || 'BIDDER');
    sendResponse(res, 201, true, {
      token
    }, 'User registered successfully');
  } catch (err) {
    next(err);
  }
};
exports.login = async (req, res, next) => {
  try {
    const {
      email,
      password
    } = req.body;
    if (!email || !password) {
      return sendResponse(res, 400, false, null, 'Please provide an email and password');
    }
    const user = (await db.query("SELECT * FROM users WHERE email = $1", [email])).rows[0];
    if (!user) {
      return sendResponse(res, 401, false, null, 'Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendResponse(res, 401, false, null, 'Invalid credentials');
    }
    const token = generateToken(user.id, user.role);
    sendResponse(res, 200, true, {
      token
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};
exports.getMe = async (req, res, next) => {
  try {
    const user = (await db.query("SELECT id, name, email, role, created_at FROM users WHERE id = $1", [req.user.id])).rows[0];
    sendResponse(res, 200, true, user, 'User data retrieved');
  } catch (err) {
    next(err);
  }
};