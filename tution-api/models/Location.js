const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
    // --- MULTI-TENANT FIELD ---
    // Links this location to the teacher who created it
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
        index: true
    },
    // --- Location Name ---
    name: {
        type: String,
        required: true,
        trim: true
        // 'unique: true' removed from here because it would be global
    }
}, { 
    timestamps: true 
});

// This ensures that one teacher cannot have two locations with the same name,
// but two DIFFERENT teachers can each have a location named "Main Hall".
locationSchema.index({ teacherId: 1, name: 1 }, { unique: true });

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;