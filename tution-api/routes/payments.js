const router = require('express').Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const auth = require('../middleware/auth'); // Import security guard

// --- GET payment status list (Filtered by Teacher) ---
// GET /api/payments/statuslist
router.get('/statuslist', auth, async (req, res) => {
    try {
        const { month, year, grade, location } = req.query;
        if (!month || !year) {
            return res.status(400).json({ message: 'Month and Year are required.' });
        }

        // 1. Build student filter - STRICTLY scoped to this teacher
        const studentFilter = { 
            isActive: true, 
            teacherId: req.teacherId 
        };
        
        if (grade && grade !== 'All') {
            studentFilter.grade = grade;
        }
        if (location && location !== 'All') {
            studentFilter.location = location;
        }

        // 2. Get ONLY this teacher's students
        const students = await Student.find(studentFilter).sort({ name: 1 });

        // 3. Get ONLY this teacher's payments for this specific time
        const payments = await Payment.find({ 
            month, 
            year, 
            teacherId: req.teacherId 
        });

        // 4. Create a Map of payments for fast lookup
        const paymentMap = new Map();
        payments.forEach(payment => {
            paymentMap.set(payment.student.toString(), payment);
        });

        // 5. Combine the lists
        const combinedList = students.map(student => {
            const payment = paymentMap.get(student._id.toString());
            return {
                student: student,
                status: payment ? payment.status : 'Pending',
                paymentId: payment ? payment._id : null,
                amount: payment ? payment.amount : null 
            };
        });

        res.json(combinedList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- MARK A PAYMENT (UPSERT) (Filtered by Teacher) ---
// POST /api/payments/mark
router.post('/mark', auth, async (req, res) => {
    try {
        const { studentId, month, year, status, amount } = req.body;

        // Security check: Ensure the student belongs to this teacher
        const studentCheck = await Student.findOne({ _id: studentId, teacherId: req.teacherId });
        if (!studentCheck) {
            return res.status(403).json({ message: "Unauthorized: Student does not belong to you." });
        }

        // Filter must include teacherId to ensure isolation
        const filter = { 
            student: studentId, 
            teacherId: req.teacherId, 
            month, 
            year 
        };

        const updateDoc = {
            $set: { 
                status: status,
                student: studentId,
                teacherId: req.teacherId, // Ensure teacherId is saved on insert
                month: month,
                year: year
            }
        };

        if (amount !== undefined) {
            updateDoc.$set.amount = Number(amount);
        } else if (status === 'Pending') {
            updateDoc.$set.amount = 0; 
        } else {
            updateDoc.$setOnInsert = { amount: 0 };
        }
        
        const updatedPayment = await Payment.findOneAndUpdate(
            filter,
            updateDoc,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        
        res.status(201).json(updatedPayment);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- RESET (Delete ALL) payments for THIS teacher ---
// DELETE /api/payments/reset
router.delete('/reset', auth, async (req, res) => {
    try {
        // ONLY delete records belonging to this teacher
        const deleteResult = await Payment.deleteMany({ teacherId: req.teacherId });

        res.json({
            message: `Successfully reset your finance data. Deleted ${deleteResult.deletedCount} records.`,
            deletedCount: deleteResult.deletedCount
        });
    } catch (err) {
        console.error("Error resetting finance data:", err);
        res.status(500).json({ message: 'Error: ' + err.message });
    }
});

module.exports = router;