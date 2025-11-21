const PDFDocument = require('pdfkit');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const User = require('../models/User');

async function generateAttendanceReport(sessionId) {
  const session = await AttendanceSession.findById(sessionId).populate('createdBy');
  if (!session) {
    throw new Error('Session not found');
  }

  // Get all students enrolled in the session's courses
  const courseSections = session.courses.map(c => ({ course: c.course, section: c.section }));
  
  // Find students who have at least one matching course-section
  const enrolledStudents = await User.find({
    role: 'student',
    $or: courseSections.map(cs => ({
      courses: { $elemMatch: { course: cs.course, section: cs.section } }
    }))
  }).sort({ enrollmentNumber: 1 });

  // Get attendance records
  const attendanceRecords = await Attendance.find({ session: sessionId })
    .populate('student')
    .sort({ enrollmentNumber: 1 });

  const attendanceMap = new Map();
  attendanceRecords.forEach(record => {
    attendanceMap.set(record.student._id.toString(), record);
  });

  // Separate students into present and absent
  const presentStudents = [];
  const absentStudents = [];

  enrolledStudents.forEach(student => {
    const attendance = attendanceMap.get(student._id.toString());
    const studentData = {
      student,
      attendance
    };
    
    if (attendance) {
      presentStudents.push(studentData);
    } else {
      absentStudents.push(studentData);
    }
  });

  // Create PDF
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {});

  // Header
  doc.fontSize(20).text('Attendance Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12);
  doc.text(`Session: ${session.title}`, { align: 'left' });
  doc.text(`Date: ${new Date(session.startTime).toLocaleDateString()}`, { align: 'left' });
  doc.text(`Time: ${new Date(session.startTime).toLocaleTimeString()} - ${new Date(session.endTime).toLocaleTimeString()}`, { align: 'left' });
  doc.moveDown();

  const itemHeight = 20;
  const pageWidth = doc.page.width - 100;
  const col1Width = pageWidth * 0.35;
  const col2Width = pageWidth * 0.3;
  const col3Width = pageWidth * 0.35;

  // Helper function to draw a table section
  const drawTableSection = (title, students, y) => {
    // Check if we need a new page
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }

    // Section heading
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(title, 50, y, { width: pageWidth });
    y += 20;

    // Check if we need a new page after heading
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = y;
    doc.text('Student Name', 50, tableTop, { width: col1Width });
    doc.text('Enrollment No.', 50 + col1Width, tableTop, { width: col2Width });
    doc.text('Course & Section', 50 + col1Width + col2Width, tableTop, { width: col3Width });

    // Draw line under header
    doc.moveTo(50, tableTop + 15).lineTo(50 + pageWidth, tableTop + 15).stroke();

    y = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    // Table rows
    students.forEach((studentData) => {
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 50;
        // Redraw header on new page
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Student Name', 50, y, { width: col1Width });
        doc.text('Enrollment No.', 50 + col1Width, y, { width: col2Width });
        doc.text('Course & Section', 50 + col1Width + col2Width, y, { width: col3Width });
        doc.moveTo(50, y + 15).lineTo(50 + pageWidth, y + 15).stroke();
        y += 25;
        doc.font('Helvetica').fontSize(9);
      }

      const student = studentData.student;
      
      // Find matching course-section for this session
      const matchingCourse = student.courses.find(sc => 
        session.courses.some(sessionCourse => 
          sessionCourse.course === sc.course && sessionCourse.section === sc.section
        )
      );
      const courseSection = matchingCourse 
        ? `${matchingCourse.course} - ${matchingCourse.section}`
        : (student.courses.length > 0 ? `${student.courses[0].course} - ${student.courses[0].section}` : 'N/A');

      doc.text(student.name, 50, y, { width: col1Width });
      doc.text(student.enrollmentNumber, 50 + col1Width, y, { width: col2Width });
      doc.text(courseSection, 50 + col1Width + col2Width, y, { width: col3Width });

      // Draw line
      doc.moveTo(50, y + 15).lineTo(50 + pageWidth, y + 15).stroke();
      y += itemHeight;
    });

    return y + 10; // Return Y position with some spacing
  };

  // Draw Present Students section
  let currentY = doc.y;
  if (presentStudents.length > 0) {
    currentY = drawTableSection(`PRESENT STUDENTS (${presentStudents.length})`, presentStudents, currentY);
    doc.moveDown();
    currentY = doc.y;
  }

  // Draw Absent Students section
  if (absentStudents.length > 0) {
    currentY = drawTableSection(`ABSENT STUDENTS (${absentStudents.length})`, absentStudents, currentY);
  }

  // Summary
  doc.moveDown(2);
  doc.fontSize(11).font('Helvetica-Bold');
  let summaryY = doc.y;
  doc.text(`SUMMARY`, 50, summaryY);
  doc.fontSize(10);
  summaryY += 20;
  doc.text(`Total Students: ${enrolledStudents.length}`, 50, summaryY);
  doc.text(`Present: ${presentStudents.length}`, 50, summaryY + 15);
  doc.text(`Absent: ${absentStudents.length}`, 50, summaryY + 30);

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);
  });
}

module.exports = { generateAttendanceReport };

