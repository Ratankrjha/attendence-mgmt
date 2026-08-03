const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!["Teacher", "CR"].includes(role)) {
      return res.status(400).json({ message: "Role must be either Teacher or CR" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id);

    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id);
    res.status(200).json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/profile
exports.getProfile = async (req, res, next) => {
  try {
    res.status(200).json({ user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/preferences
exports.getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    res.status(200).json({ preferences: user.preferences || {} });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/auth/preferences
exports.updatePreferences = async (req, res, next) => {
  try {
    const updates = req.body || {};
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Merge preferences shallowly
    user.preferences = Object.assign({}, user.preferences || {}, updates);
    await user.save();
    res.status(200).json({ preferences: user.preferences });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};
