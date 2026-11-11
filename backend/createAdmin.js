// createAdmin.js
// Run this ONCE to create the admin user in your database
// Command: node createAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Connect to MongoDB ─────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school-erp';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✓ MongoDB connected:', MONGO_URI))
  .catch(err => { console.error('✗ MongoDB error:', err.message); process.exit(1); });

// ── User Schema (matches your existing User model) ─────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'school_admin' },
  isActive: { type: Boolean, default: true },
  phone:    { type: String },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── Admin users to create ──────────────────────────────────
const ADMIN_USERS = [
  {
    name:     'School Admin',
    email:    'admin@school.com',
    password: 'admin123',
    role:     'school_admin',
    phone:    '9876543210',
  },
  {
    name:     'Super Admin',
    email:    'superadmin@school.com',
    password: 'super123',
    role:     'super_admin',
    phone:    '9876543211',
  },
];

// ── Create users ───────────────────────────────────────────
async function createAdmins() {
  try {
    for (const userData of ADMIN_USERS) {
      // Check if user already exists
      const existing = await User.findOne({ email: userData.email });

      if (existing) {
        // Update password in case it changed
        const hashed = await bcrypt.hash(userData.password, 12);
        await User.findOneAndUpdate(
          { email: userData.email },
          { password: hashed, isActive: true, name: userData.name, role: userData.role }
        );
        console.log('✓ Updated existing user:', userData.email);
      } else {
        // Create new user with hashed password
        const hashed = await bcrypt.hash(userData.password, 12);
        await User.create({ ...userData, password: hashed });
        console.log('✓ Created new user:', userData.email);
      }
    }

    console.log('\n========================================');
    console.log('✅ Admin users ready!');
    console.log('========================================');
    console.log('Login 1:');
    console.log('  Email:    admin@school.com');
    console.log('  Password: admin123');
    console.log('  Role:     School Admin');
    console.log('----------------------------------------');
    console.log('Login 2:');
    console.log('  Email:    superadmin@school.com');
    console.log('  Password: super123');
    console.log('  Role:     Super Admin');
    console.log('========================================');
    console.log('\nNow go to http://localhost:5173 and login!');

    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

// Run after DB connects
mongoose.connection.once('open', createAdmins);