const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// --- REGISTER A NEW TEACHER ---
router.post('/register', async (req, res) => {
    try {
        // 1. Destructure the new fields from the request body
        const { firstName, lastName, email, password, instituteName, location } = req.body;

        // 2. Check if teacher already exists
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ message: "A teacher with this email already exists." });
        }

        // 3. Hash the password
        const hashedPassword = await bcrypt.hash(password, 8);

        // 4. Create the teacher with the new schema structure
        const teacher = new Teacher({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            instituteName,
            location
        });

        await teacher.save();

        // 5. Generate Token
        const token = jwt.sign(
            { id: teacher._id }, 
            process.env.JWT_SECRET || 'your_fallback_secret', 
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: "Teacher registered successfully",
            token,
            teacher: {
                id: teacher._id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                email: teacher.email,
                instituteName: teacher.instituteName,
                location: teacher.location
            }
        });
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ message: "Server error during registration." });
    }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const teacher = await Teacher.findOne({ email });
        if (!teacher) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: teacher._id }, 
            process.env.JWT_SECRET || 'your_fallback_secret', 
            { expiresIn: '24h' }
        );

        res.json({
            token,
            teacher: {
                id: teacher._id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                email: teacher.email,
                instituteName: teacher.instituteName,
                location: teacher.location
            }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error during login." });
    }
});

// --- GET CURRENT TEACHER INFO ---
router.get('/me', auth, async (req, res) => {
    try {
        // .select('-password') ensures we don't leak the hashed password to the frontend
        const teacher = await Teacher.findById(req.teacherId).select('-password');
        res.json(teacher);
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});


// --- UPDATE TEACHER PROFILE ---
// PUT /api/auth/update
router.put('/update', auth, async (req, res) => {
    try {
        const { firstName, lastName, instituteName, location } = req.body;

        // 1. Find the teacher by ID (provided by the 'auth' middleware)
        const teacher = await Teacher.findById(req.teacherId);

        if (!teacher) {
            return res.status(404).json({ message: "Teacher account not found." });
        }

        // 2. Update the fields
        if (firstName) teacher.firstName = firstName;
        if (lastName) teacher.lastName = lastName;
        if (instituteName) teacher.instituteName = instituteName;
        if (location) teacher.location = location;

        // 3. Save the changes
        await teacher.save();

        // 4. Return the updated teacher (excluding password)
        res.json({
            message: "Profile updated successfully",
            teacher: {
                id: teacher._id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                email: teacher.email,
                instituteName: teacher.instituteName,
                location: teacher.location
            }
        });
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ message: "Server error during profile update." });
    }
});

module.exports = router;