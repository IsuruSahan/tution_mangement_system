const router = require('express').Router();
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// GET /api/dashboard
router.get('/', async (req, res) => {
    try {
        // --- 1. Get Dates and Month/Year ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();

        // --- 2. Get Simple Totals ---
        const totalStudents = await Student.countDocuments({ isActive: true });

        // --- 3. Get Attendance Stats for ACTIVE students ---
        const presentStats = await Attendance.aggregate([
            { 
                $match: { 
                    date: { $gte: today, $lt: tomorrow },
                    status: 'Present' 
                }
            },
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentDetails'
                }
            },
            { $unwind: '$studentDetails' },
            { $match: { 'studentDetails.isActive': true } },
            {
                $facet: {
                    "totalPresent": [
                        { $count: "count" }
                    ],
                    "presentByGrade": [
                        { $group: { _id: "$classGrade", count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);

        const presentToday = presentStats[0].totalPresent[0] ? presentStats[0].totalPresent[0].count : 0;
        const presentTodayByGrade = presentStats[0].presentByGrade;


        // --- 4. Get Grade-Wise Student Totals ---
        const totalStudentsByGrade = await Student.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: "$grade", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);


        // --- 5. Aggregate Payment Stats ---
        const allStudentStats = await Student.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'payments',
                    let: { studentId: "$_id" },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: { $eq: ["$student", "$$studentId"] },
                                month: currentMonth,
                                year: currentYear,
                                status: 'Paid'
                            }
                        }
                    ],
                    as: 'paymentDetails'
                }
            },
            {
                $addFields: {
                    paymentStatus: {
                        $cond: {
                            if: { $gt: [{ $size: "$paymentDetails" }, 0] },
                            then: "Paid",
                            else: "Pending"
                        }
                    }
                }
            },
            {
                $facet: {
                    "paymentStatusThisMonth": [
                        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
                    ],
                    "pendingPaymentsByGrade": [
                        { $match: { paymentStatus: 'Pending' } },
                        { $group: { _id: "$grade", count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);

        const stats = allStudentStats[0];
        const paymentStatusThisMonth = stats.paymentStatusThisMonth;
        const pendingPaymentsByGrade = stats.pendingPaymentsByGrade;

        // --- NEW: 6. Get Income Stats ---
        const incomeStats = await Payment.aggregate([
            {
                $match: {
                    status: 'Paid',
                    year: currentYear // Filter for the current year
                }
            },
            {
                $facet: {
                    // Branch 1: Total for the year
                    "yearTotal": [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$amount" }
                            }
                        }
                    ],
                    // Branch 2: Total for the month
                    "monthTotal": [
                        // Filter again for the current month
                        { 
                            $match: { month: currentMonth }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$amount" }
                            }
                        }
                    ]
                }
            }
        ]);

        const totalIncomeThisYear = incomeStats[0].yearTotal[0] ? incomeStats[0].yearTotal[0].total : 0;
        const totalIncomeThisMonth = incomeStats[0].monthTotal[0] ? incomeStats[0].monthTotal[0].total : 0;


        // --- 7. Send all data back ---
        res.json({
            // Simple totals
            totalStudents,
            presentToday,
            totalIncomeThisMonth, // <-- NEW
            totalIncomeThisYear,  // <-- NEW
            
            // Grade-wise arrays
            totalStudentsByGrade,
            presentTodayByGrade,
            pendingPaymentsByGrade,
            
            // Chart data
            paymentStatusThisMonth
        });

    } catch (err) {
        res.status(500).json({ message: "Error fetching dashboard data: " + err.message });
    }
});

module.exports = router;