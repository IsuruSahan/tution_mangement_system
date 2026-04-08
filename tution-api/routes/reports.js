const router = require('express').Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student'); 
const mongoose = require('mongoose');

router.get('/finance', async (req, res) => {
    try {
        const { month, year, grade, location } = req.query;

        // --- 1. Basic Income Aggregation (Breakdown & Grand Total) ---
        const paymentMatchFilter = { status: 'Paid' };
        if (month && month !== 'All') paymentMatchFilter.month = month;
        if (year && year !== 'All') paymentMatchFilter.year = Number(year);

        const studentMatchFilter = {};
        if (grade && grade !== 'All') studentMatchFilter['studentDetails.grade'] = grade;
        if (location && location !== 'All') studentMatchFilter['studentDetails.location'] = location;

        const reportData = await Payment.aggregate([
            { $match: paymentMatchFilter },
            {
                $lookup: {
                    from: 'students', 
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentDetails'
                }
            },
            { $unwind: '$studentDetails' },
            { $match: studentMatchFilter },
            {
                $facet: {
                    "breakdown": [
                        {
                            $group: {
                                _id: {
                                    year: '$year',
                                    month: '$month',
                                    grade: '$studentDetails.grade',
                                    location: '$studentDetails.location'
                                },
                                totalIncome: { $sum: '$amount' },
                                studentsPaid: { $sum: 1 }
                            }
                        },
                        { $sort: { '_id.year': -1, '_id.month': 1 } }
                    ],
                    "grandTotal": [
                        {
                            $group: {
                                _id: null,
                                totalIncome: { $sum: '$amount' },
                                totalStudentsPaid: { $sum: 1 }
                            }
                        }
                    ],
                    "paidStudentIds": [
                        { $group: { _id: '$student' } }
                    ]
                }
            }
        ]);

        // --- 2. NEW FEATURE: Robust Unpaid Calculation ---
        let unpaidStudents = [];
        let unpaidCount = 0;

        if (month !== 'All' && year !== 'All') {
            // A. Get list of IDs who HAVE paid for this specific month/year
            const paidIds = (reportData[0]?.paidStudentIds || []).map(item => item._id);

            // B. Build the filter for all students who SHOULD pay
            const activeClassFilter = { isActive: true };
            if (grade && grade !== 'All') activeClassFilter.grade = grade;
            if (location && location !== 'All') activeClassFilter.location = location;

            // --- DEBUG LOGS: Check your terminal! ---
            console.log(`🔍 Checking Unpaid for: ${month} ${year} | Class: ${grade} | Loc: ${location}`);
            
            // C. Find students in this class NOT in the paidIds list
            unpaidStudents = await Student.find({
                ...activeClassFilter,
                _id: { $nin: paidIds }
            }).select('name studentId grade location contactPhone'); // Corrected to contactPhone
            
            unpaidCount = unpaidStudents.length;
            console.log(`👨‍🎓 Found ${unpaidCount} unpaid students.`);
        }

        res.json({
            breakdown: reportData[0]?.breakdown || [], 
            grandTotal: reportData[0]?.grandTotal[0] || { totalIncome: 0, totalStudentsPaid: 0 },
            unpaidStudents,
            unpaidCount
        });

    } catch (err) {
        console.error("Finance Error:", err);
        res.status(500).json({ message: "Error: " + err.message });
    }
});

module.exports = router;