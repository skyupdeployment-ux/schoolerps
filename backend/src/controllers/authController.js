const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

  const user = await User.findOne({ email });
  if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  await AuditLog.create({
    user: user._id, action: 'LOGIN', module: 'Auth',
    description: `${user.name} logged in`, ipAddress: req.ip
  });

  res.json({ success: true, data: { user, accessToken, refreshToken } });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    const { accessToken, refreshToken: newRefresh } = generateTokens(user._id);
    user.refreshToken = newRefresh;
    await user.save();
    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch {
    res.status(401).json({ success: false, message: 'Token expired' });
  }
};

exports.logout = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.refreshToken = null;
  await user.save();
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};
