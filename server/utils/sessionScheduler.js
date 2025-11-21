const AttendanceSession = require('../models/AttendanceSession');

const checkScheduledSessions = async () => {
  try {
    const now = new Date();
    
    // Find sessions that should start
    const sessionsToStart = await AttendanceSession.find({
      status: 'scheduled',
      startTime: { $lte: now }
    });

    for (const session of sessionsToStart) {
      session.status = 'active';
      session.startedAt = now;
      await session.save();
      console.log(`Session ${session._id} started automatically`);
    }

    // Find sessions that should end
    const sessionsToEnd = await AttendanceSession.find({
      status: 'active',
      endTime: { $lte: now }
    });

    for (const session of sessionsToEnd) {
      session.status = 'ended';
      session.endedAt = now;
      await session.save();
      console.log(`Session ${session._id} ended automatically`);
    }
  } catch (error) {
    console.error('Error in session scheduler:', error);
  }
};

module.exports = { checkScheduledSessions };

