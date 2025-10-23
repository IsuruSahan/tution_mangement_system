const router = require('express').Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student'); // We need this to $lookup
const mongoose = require('mongoose');

// GET /api/reports/finance
// Accepts query params: ?month=...&year=...&grade=...&location=...
router.get('/finance', async (req, res) => {
    try {
        const { month, year, grade, location } = req.query;

        // --- 1. Build Match Filters ---

        // Filter for the Payment collection
        const paymentMatchFilter = { status: 'Paid' };
        if (month && month !== 'All') {
            paymentMatchFilter.month = month;
        }
        if (year && year !== 'All') {
            paymentMatchFilter.year = Number(year);
        }

        // Filter for the Student collection (after $lookup)
        const studentMatchFilter = {};
        if (grade && grade !== 'All') {
            studentMatchFilter['studentDetails.grade'] = grade;
        }
        if (location && location !== 'All') {
            studentMatchFilter['studentDetails.location'] = location;
        }

        // --- 2. Run the Aggregation Pipeline ---
        const reportData = await Payment.aggregate([
            // Stage 1: Filter payments by status, month, and year
            { $match: paymentMatchFilter },
            
            // Stage 2: Join with the students collection
            {
                $lookup: {
                    from: 'students', // The name of the students collection in MongoDB
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentDetails'
                }
            },
            
            // Stage 3: $unwind to deconstruct the studentDetails array
            { $unwind: '$studentDetails' },
            
            // Stage 4: Filter by student grade and location
            { $match: studentMatchFilter },

            // Stage 5: Run $facet to get grand total AND breakdown in one query
            {
                $facet: {
                    // Branch A: Get the detailed breakdown
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
                        {
                            $sort: { 
                                '_id.year': -1, 
                                '_id.month': 1, 
                                '_id.grade': 1, 
                                '_id.location': 1 
                            }
                        }
                    ],
                    // Branch B: Get the grand total
                    "grandTotal": [
                        {
                            $group: {
                                _id: null,
                                totalIncome: { $sum: '$amount' },
                                totalStudentsPaid: { $sum: 1 }
                            }
                        }
                    ]
                }
            }
        ]);

        // --- 3. Format and Send the Response ---
        res.json({
            // Use [0] because $facet returns an array
            breakdown: reportData[0].breakdown, 
            // Use [0] because $group returns an array
            grandTotal: reportData[0].grandTotal[0] || { totalIncome: 0, totalStudentsPaid: 0 } 
        });

    } catch (err) {
        res.status(500).json({ message: "Error fetching finance report: " + err.message });
    }
});

module.exports = router;