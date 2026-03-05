const router = require('express').Router();
const Location = require('../models/Location');

// --- GET ALL locations ---
// (No change to this function)
router.get('/', async (req, res) => {
    try {
        const locations = await Location.find().sort({ name: 1 });
        res.json(locations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- CREATE a new location ---
// (No change to this function)
router.post('/', async (req, res) => {
    const location = new Location({
        name: req.body.name
    });
    try {
        const newLocation = await location.save();
        res.status(201).json(newLocation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- DELETE a location ---
// *** THIS FUNCTION IS REWRITTEN ***
// DELETE /api/locations/12345
router.delete('/:id', async (req, res) => {
    try {
        // Use findByIdAndDelete which finds and removes in one atomic operation
        const deletedLocation = await Location.findByIdAndDelete(req.params.id);

        if (deletedLocation == null) {
            // If findByIdAndDelete returns null, it means no document with that ID was found
            return res.status(404).json({ message: 'Cannot find location' });
        }

        // Successfully deleted
        res.json({ message: 'Deleted Location' });

    } catch (err) {
        // Handle potential errors like invalid ID format or DB issues
        console.error("Error deleting location:", err); // Log the actual error on the server
        res.status(500).json({ message: 'Error deleting location: ' + err.message });
    }
});
// *** END OF REWRITTEN FUNCTION ***

module.exports = router;