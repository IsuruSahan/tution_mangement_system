const router = require('express').Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const auth = require('../middleware/auth'); // Import security guard

// --- CREATE a new attendance record ---
router.post('/', auth, async (req, res) => {
    try {
        // Ensure the student exists AND belongs to this teacher
        const student = await Student.findOne({ _id: req.body.studentId, teacherId: req.teacherId });
        if (!student) {
            return res.status(404).json({ message: "Student not found or unauthorized" });
        }
        
        const newAttendance = new Attendance({
            teacherId: req.teacherId, // Tag the record
            student: req.body.studentId,
            date: new Date(req.body.date),
            status: req.body.status,
            classGrade: student.grade,
            location: student.location
        });
        const savedRecord = await newAttendance.save();
        res.status(201).json(savedRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- GET attendance for a specific class (Filtered by Teacher) ---
router.get('/class', auth, async (req, res) => {
    try {
        const { date, grade, location } = req.query;
        if (!date || !grade || !location) {
            return res.status(400).json({ message: "Please provide date, grade, and location" });
        }
        
        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(queryDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const records = await Attendance.find({
            teacherId: req.teacherId, // Ensure teacher only sees their data
            date: { $gte: startOfDay, $lte: endOfDay },
            classGrade: grade,
            location: location
        }).populate('student', 'name');
        
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- GET all attendance for ONE student (Filtered by Teacher) ---
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Security check: Ensure this student belongs to this teacher
        const studentCheck = await Student.findOne({ _id: req.params.studentId, teacherId: req.teacherId });
        if (!studentCheck) return res.status(403).json({ message: "Unauthorized access to student records" });

        const filter = { 
            student: req.params.studentId,
            teacherId: req.teacherId 
        };

        if (startDate) {
            const start = new Date(startDate);
            if (!isNaN(start.getTime())) {
                start.setUTCHours(0, 0, 0, 0);
                filter.date = { $gte: start };
            }
        }
        if (endDate) {
            const end = new Date(endDate);
            if (!isNaN(end.getTime())) {
                end.setUTCHours(23, 59, 59, 999);
                filter.date = filter.date ? { ...filter.date, $lte: end } : { $lte: end };
            }
        }

        const records = await Attendance.find(filter).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- CREATE or UPDATE (UPSERT) via QR Scanner (Filtered by Teacher) ---
router.post('/mark', auth, async (req, res) => {
    try {
        const { studentId, date, status, classGrade, location } = req.body;
        
        // Ensure student ownership
        const student = await Student.findOne({ _id: studentId, teacherId: req.teacherId });
        if (!student) return res.status(403).json({ message: "Student not found or unauthorized" });

        const recordDate = new Date(date);
        const startOfDay = new Date(recordDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(recordDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const updatedRecord = await Attendance.findOneAndUpdate(
            { 
                student: studentId, 
                teacherId: req.teacherId, // Scope the upsert
                date: { $gte: startOfDay, $lte: endOfDay } 
            },
            { 
                $set: { status, classGrade, location }, 
                $setOnInsert: { student: studentId, teacherId: req.teacherId, date: recordDate } 
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.status(201).json(updatedRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- GET ATTENDANCE SUMMARY (Aggregation Filtered by Teacher) ---
router.get('/summary', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ message: 'Start/end date required.' });

        const start = new Date(startDate); start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setUTCHours(23, 59, 59, 999);

        const pipeline = [
            { 
                $match: { 
                    teacherId: req.teacherId, // CRITICAL: Filter aggregation by teacher
                    date: { $gte: start, $lte: end }, 
                    status: { $in: ['Present', 'Absent'] } 
                } 
            },
            { $group: { _id: { grade: '$classGrade', location: '$location', status: '$status' }, count: { $sum: 1 } } },
            { $group: { _id: { grade: '$_id.grade', location: '$_id.location' }, present: { $sum: { $cond: [{ $eq: ['$_id.status', 'Present'] }, '$count', 0] } }, absent: { $sum: { $cond: [{ $eq: ['$_id.status', 'Absent'] }, '$count', 0] } } } },
            { $project: { _id: 0, grade: '$_id.grade', location: '$_id.location', present: '$present', absent: '$absent' } },
            { $sort: { grade: 1, location: 1 } }
        ];
        
        const summary = await Attendance.aggregate(pipeline);
        res.json(summary);
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// --- DELETE ALL attendance records for THIS teacher ---
router.delete('/reset', auth, async (req, res) => {
     try { 
         const deleteResult = await Attendance.deleteMany({ teacherId: req.teacherId }); 
         res.json({ message: `Reset attendance. Deleted ${deleteResult.deletedCount} records.`, deletedCount: deleteResult.deletedCount }); 
     } catch (err) { 
         res.status(500).json({ message: err.message }); 
     }
});

module.exports = router;