const router = require('express').Router();
const Location = require('../models/Location');
const auth = require('../middleware/auth'); // Import the security guard

// --- GET ALL locations (Filtered by Teacher) ---
router.get('/', auth, async (req, res) => {
    try {
        // Only find locations created by the logged-in teacher
        const locations = await Location.find({ teacherId: req.teacherId }).sort({ name: 1 });
        res.json(locations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- CREATE a new location ---
router.post('/', auth, async (req, res) => {
    const location = new Location({
        name: req.body.name,
        teacherId: req.teacherId // Tag the location with the teacher's ID
    });
    try {
        const newLocation = await location.save();
        res.status(201).json(newLocation);
    } catch (err) {
        // Handle duplicate location names for the SAME teacher
        if (err.code === 11000) {
            return res.status(400).json({ message: "You already have a location with this name." });
        }
        res.status(400).json({ message: err.message });
    }
});

// --- DELETE a location ---
router.delete('/:id', auth, async (req, res) => {
    try {
        // Find by ID AND ensure it belongs to the teacher before deleting
        const deletedLocation = await Location.findOneAndDelete({ 
            _id: req.params.id, 
            teacherId: req.teacherId 
        });

        if (deletedLocation == null) {
            return res.status(404).json({ message: 'Cannot find location or unauthorized' });
        }

        res.json({ message: 'Deleted Location' });
    } catch (err) {
        console.error("Error deleting location:", err);
        res.status(500).json({ message: 'Error deleting location: ' + err.message });
    }
});

module.exports = router;