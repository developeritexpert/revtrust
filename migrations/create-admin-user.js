// migrations/create-admin-user.js
require('dotenv').config(); // Load .env
const mongoose = require('mongoose');
const { User } = require('../src/models/user.model'); // Adjust path if needed
const config = require('../src/config/config'); // Import your config file

// Extract MongoDB settings
const {
  server: { mongoHost, mongoPort, db, poolSize, MONGODB_URI },
} = config;

// ✅ Use the same database connection URI as your app
const MONGO_URI =
  MONGODB_URI || `mongodb://${mongoHost}:${mongoPort}/${db}?maxPoolSize=${poolSize}`;

async function createAdminUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    // const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    // if (existingAdmin) {
    //   console.log('⚠️ Admin user already exists.');
    //   return process.exit(0);
    // }

    // ✅ Let Mongoose handle password hashing
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'password', // plain text (schema hook will hash)
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true,
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: password`);
    console.log(`Role: ${adminUser.role}`);
    console.log('-----------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
