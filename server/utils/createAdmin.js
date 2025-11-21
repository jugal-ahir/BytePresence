const User = require('../models/User');
const mongoose = require('mongoose');
require('dotenv').config();

// Script to create an admin user
async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if admin exists
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      admin.role = 'admin';
      admin.password = adminPassword; // Will be hashed by pre-save hook
      await admin.save();
      console.log('Admin user updated successfully');
    } else {
      admin = new User({
        name: 'Admin',
        enrollmentNumber: 'ADMIN001',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        courses: []
      });
      await admin.save();
      console.log('Admin user created successfully');
    }
    
    console.log(`Admin credentials:`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

