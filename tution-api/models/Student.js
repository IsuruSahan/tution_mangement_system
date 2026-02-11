const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    // --- MULTI-TENANT FIELD ---
    // This links every student to a specific teacher account
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
        index: true // Fast lookups when a teacher loads their list
    },
    // --- ID FIELD ---
    studentId: {
        type: String, 
        required: true,
        // We removed 'unique: true' globally because different teachers 
        // might use the same ID numbers.
        index: true   
    },
    // --- Existing Fields ---
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    grade: { 
        type: String, 
        required: true 
    },
    location: { 
        type: String, 
        required: true 
    },
    contactPhone: { 
        type: String 
    },
    parentName: { 
        type: String 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { 
    timestamps: true 
});

// This ensures that a studentId is unique ONLY for a specific teacher.
// Teacher A can have ID 1001, and Teacher B can also have ID 1001.
studentSchema.index({ teacherId: 1, studentId: 1 }, { unique: true });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;