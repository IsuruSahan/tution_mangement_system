const router = require('express').Router();
const Student = require('../models/Student');

// --- CREATE a new student ---
// POST /api/students
router.post('/', async (req, res) => {
    // ... (code is correct)
    try {
        const newStudent = new Student({
            name: req.body.name, grade: req.body.grade, location: req.body.location,
            contactPhone: req.body.contactPhone, parentName: req.body.parentName
        });
        const savedStudent = await newStudent.save();
        res.status(201).json(savedStudent);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- GET all students (with filtering) ---
// GET /api/students
router.get('/', async (req, res) => {
    // ... (code is correct)
    try {
        const filter = { isActive: true };
        if (req.query.grade && req.query.grade !== 'All') { filter.grade = req.query.grade; }
        if (req.query.location && req.query.location !== 'All') { filter.location = req.query.location; }
        const students = await Student.find(filter).sort({ name: 1 });
        res.json(students);
    } catch (err) { console.error("Error fetching students:", err); res.status(500).json({ message: 'Error fetching students: ' + err.message }); }
});

// --- GET one specific student (by ID) ---
// GET /api/students/:id
// IMPORTANT: Specific routes like '/reset' must come BEFORE routes with parameters like '/:id'
router.get('/:id', async (req, res) => {
    // ... (code is correct)
     try {
        const student = await Student.findById(req.params.id);
        if (student == null) { return res.status(404).json({ message: 'Cannot find student' }); }
        res.json(student);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- UPDATE a student ---
// PATCH /api/students/:id
router.patch('/:id', async (req, res) => {
    // ... (code is correct)
    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id, req.body, { new: true, runValidators: true }
        );
        if (updatedStudent == null) { return res.status(404).json({ message: 'Cannot find student' }); }
        res.json(updatedStudent);
    } catch (err) { res.status(400).json({ message: err.message }); }
});


// --- *** MOVED THIS ROUTE UP *** ---
// --- RESET (Deactivate ALL) students ---
// DELETE /api/students/reset
// MUST be defined BEFORE the '/:id' delete route
router.delete('/reset', async (req, res) => {
    try {
        const updateResult = await Student.updateMany({}, { $set: { isActive: false } });
        console.log("Resetting (Deactivating) Students:", updateResult);
        res.json({
            message: `Successfully deactivated all students. Updated ${updateResult.modifiedCount} student records.`,
            modifiedCount: updateResult.modifiedCount
        });
    } catch (err) {
        console.error("Error deactivating all students:", err);
        res.status(500).json({ message: 'Error deactivating all students: ' + err.message });
    }
});
// --- *** END OF MOVED ROUTE *** ---


// --- DELETE (Deactivate ONE) student ---
// DELETE /api/students/:id
router.delete('/:id', async (req, res) => {
    // ... (code is correct)
    try {
        const student = await Student.findById(req.params.id);
        if (student == null) { return res.status(404).json({ message: 'Cannot find student' }); }
        student.isActive = false;
        await student.save();
        res.json({ message: 'Deactivated Student' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});


module.exports = router;