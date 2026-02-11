const router = require('express').Router();
const Student = require('../models/Student');
const auth = require('../middleware/auth'); // Import the security guard

// --- Helper function to generate a random 4-digit ID (1000-9999) ---
function generateStudentId() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// --- CREATE a new student ---
// POST /api/students
router.post('/', auth, async (req, res) => {
    try {
        let uniqueIdFound = false;
        let generatedId;
        let attempts = 0; 

        // --- Loop to find a unique ID WITHIN this teacher's scope ---
        while (!uniqueIdFound && attempts < 100) {
            generatedId = generateStudentId();
            // We search for the ID AND the teacherId
            const existingStudent = await Student.findOne({ 
                studentId: generatedId, 
                teacherId: req.teacherId 
            });
            if (!existingStudent) {
                uniqueIdFound = true;
            }
            attempts++;
        }

        if (!uniqueIdFound) {
            return res.status(500).json({ message: "Could not generate a unique student ID. Please try again." });
        }

        const newStudent = new Student({
            teacherId: req.teacherId, // Automatically tag with logged-in teacher
            studentId: generatedId,
            name: req.body.name,
            grade: req.body.grade,
            location: req.body.location,
            contactPhone: req.body.contactPhone,
            parentName: req.body.parentName
        });

        const savedStudent = await newStudent.save();
        res.status(201).json(savedStudent);

    } catch (err) {
         if (err.code === 11000) {
             return res.status(400).json({ message: "Duplicate entry error for this ID." });
         }
        res.status(400).json({ message: "Error creating student: " + err.message });
    }
});

// --- GET all students (FILTERED BY TEACHER) ---
// GET /api/students
router.get('/', auth, async (req, res) => {
    try { 
        // We ALWAYS include teacherId in the filter for security
        const filter = { isActive: true, teacherId: req.teacherId }; 

        if (req.query.grade && req.query.grade !== 'All') { 
            filter.grade = req.query.grade; 
        } 
        if (req.query.location && req.query.location !== 'All') { 
            filter.location = req.query.location; 
        } 
        
        const students = await Student.find(filter).sort({ name: 1 }); 
        res.json(students); 
    } catch (err) { 
        console.error("Error fetching students:", err); 
        res.status(500).json({ message: 'Error fetching students: ' + err.message }); 
    }
});

// --- GET one specific student ---
router.get('/:id', auth, async (req, res) => {
     try { 
         // Find by ID AND verify it belongs to this teacher
         const student = await Student.findOne({ _id: req.params.id, teacherId: req.teacherId }); 
         if (student == null) { 
             return res.status(404).json({ message: 'Cannot find student or unauthorized' }); 
         } 
         res.json(student); 
     } catch (err) { 
         res.status(500).json({ message: err.message }); 
     }
});

// --- UPDATE a student ---
router.patch('/:id', auth, async (req, res) => {
    const { studentId, teacherId, ...updateData } = req.body; // Protect critical fields

    try {
        const updatedStudent = await Student.findOneAndUpdate(
            { _id: req.params.id, teacherId: req.teacherId }, // Ensure ownership
            updateData, 
            { new: true, runValidators: true }
        );
        if (updatedStudent == null) { 
            return res.status(404).json({ message: 'Cannot find student or unauthorized' }); 
        }
        res.json(updatedStudent);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- RESET (Deactivate ALL) students for THIS teacher ---
router.delete('/reset', auth, async (req, res) => {
    try { 
        const updateResult = await Student.updateMany(
            { teacherId: req.teacherId }, 
            { $set: { isActive: false } }
        ); 
        res.json({ message: `Deactivated your students. Updated ${updateResult.modifiedCount} records.`, modifiedCount: updateResult.modifiedCount }); 
    } catch (err) { 
        res.status(500).json({ message: 'Error: ' + err.message }); 
    }
});

// --- DELETE (Deactivate ONE) student ---
router.delete('/:id', auth, async (req, res) => {
    try { 
        const student = await Student.findOne({ _id: req.params.id, teacherId: req.teacherId }); 
        if (student == null) { 
            return res.status(404).json({ message: 'Cannot find student or unauthorized' }); 
        } 
        student.isActive = false; 
        await student.save(); 
        res.json({ message: 'Deactivated Student' }); 
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// --- GET student by their 4-digit studentId (QR SCANNER) ---
router.get('/by-id/:studentId', auth, async (req, res) => {
    try {
        const student = await Student.findOne({ 
            studentId: req.params.studentId, 
            teacherId: req.teacherId, // Ensure teacher only scans their own students
            isActive: true 
        });

        if (student == null) {
            return res.status(404).json({ message: 'Cannot find active student with this ID' });
        }
        res.json(student); 
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;