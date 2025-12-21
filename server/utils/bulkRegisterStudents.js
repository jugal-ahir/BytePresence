const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const User = require('../models/User');
require('dotenv').config();

async function bulkRegister() {
  try {
    // 1. Database Connection
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system';
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected for bulk registration...');

    // 2. Read Excel File
    const excelFilePath = path.join(__dirname, '../../Excel/students.xlsx');
    const workbook = xlsx.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const studentsData = xlsx.utils.sheet_to_json(sheet);

    console.log(`Found ${studentsData.length} students in Excel file.`);

    // 3. Process each student
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const data of studentsData) {
      const { name, enrollmentNumber, email, password, role, courses, section } = data;

      try {
        // Validation: Check if student already exists by enrollment number or email
        const existingStudent = await User.findOne({
          $or: [{ enrollmentNumber: String(enrollmentNumber).toUpperCase() }, { email: String(email).toLowerCase() }]
        });

        if (existingStudent) {
          console.log(`[SKIP] Student ${name} (${enrollmentNumber}) already exists.`);
          skipCount++;
          continue;
        }

        // Create new user
        const newUser = new User({
          name: String(name).trim(),
          enrollmentNumber: String(enrollmentNumber).toUpperCase().trim(),
          email: String(email).toLowerCase().trim(),
          password: String(password),
          role: role || 'student',
          courses: [{
            course: String(courses).trim(),
            section: String(section).trim()
          }]
        });

        await newUser.save();
        console.log(`[SUCCESS] Registered: ${name} (${enrollmentNumber})`);
        successCount++;
      } catch (err) {
        console.error(`[ERROR] Failed to register student ${name}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n--- Bulk Registration Summary ---');
    console.log(`Total processed: ${studentsData.length}`);
    console.log(`Successfully registered: ${successCount}`);
    console.log(`Skipped (Duplicates): ${skipCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('---------------------------------\n');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Fatal Error during bulk registration:', error);
    process.exit(1);
  }
}

bulkRegister();
