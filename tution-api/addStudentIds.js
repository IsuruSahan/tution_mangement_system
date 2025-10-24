// removeInactiveStudents.js
require('dotenv').config(); // Load .env variables
const mongoose = require('mongoose');
const Student = require('./models/Student'); // Adjust path if needed
// You might need these if you want to clean up related data later, but be VERY careful
// const Payment = require('./models/Payment');
// const Attendance = require('./models/Attendance');

// --- Main script logic ---
async function removeInactive() {
    // 1. Connect to Database
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
        console.error('Error: MONGODB_URI is not defined in .env file.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(dbUri);
        console.log('MongoDB connected successfully.');

        // 2. Find and Delete students marked as inactive
        console.log('Finding inactive students (isActive: false)...');
        const inactiveStudents = await Student.find({ isActive: false });

        if (inactiveStudents.length === 0) {
            console.log('No inactive students found to delete.');
            await mongoose.disconnect();
            return;
        }

        console.log(`Found ${inactiveStudents.length} inactive students. Preparing to delete...`);
        const studentIdsToDelete = inactiveStudents.map(s => s._id);

        // *** THIS IS THE DELETION STEP ***
        const deleteResult = await Student.deleteMany({ _id: { $in: studentIdsToDelete } });
        // Alternative: await Student.deleteMany({ isActive: false });

        console.log('--- Deletion Complete ---');
        console.log(`Successfully deleted ${deleteResult.deletedCount} student records.`);

        // --- Optional: Clean up related data (Use with EXTREME caution) ---
        // Uncomment these lines ONLY if you are absolutely sure you want to delete
        // all payment and attendance records associated with these deleted students.
        // This is usually NOT recommended as it destroys historical data.

        // console.log('Deleting related payment records...');
        // const paymentDeleteResult = await Payment.deleteMany({ student: { $in: studentIdsToDelete } });
        // console.log(`Deleted ${paymentDeleteResult.deletedCount} payment records.`);

        // console.log('Deleting related attendance records...');
        // const attendanceDeleteResult = await Attendance.deleteMany({ student: { $in: studentIdsToDelete } });
        // console.log(`Deleted ${attendanceDeleteResult.deletedCount} attendance records.`);


    } catch (err) {
        console.error('An error occurred during the script:', err);
    } finally {
        // 3. Disconnect from Database
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

// Run the function after a confirmation prompt
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question(
    `🚨 WARNING: This script permanently deletes students marked as inactive (isActive: false).\n` +
    `Have you backed up your database? (yes/no): `,
    answer => {
        if (answer.toLowerCase() === 'yes') {
            removeInactive();
        } else {
            console.log('Operation cancelled. Please back up your database first.');
            readline.close();
            process.exit(0);
        }
        readline.close();
    }
);