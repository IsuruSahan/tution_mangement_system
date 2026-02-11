const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
    // --- MULTI-TENANT FIELD ---
    // Physical isolation: ensuring this record belongs to a specific teacher
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
        index: true
    },
    // --- Linked Student ---
    student: { 
        type: Schema.Types.ObjectId, 
        ref: 'Student', 
        required: true 
    },
    // --- Attendance Details ---
    date: { 
        type: Date, 
        required: true 
    }, 
    status: { 
        type: String, 
        enum: ['Present', 'Absent'], 
        default: 'Absent' 
    },
    // Storing these helps generate reports faster without complex joins
    classGrade: { 
        type: String 
    }, 
    location: { 
        type: String 
    } 
}, { 
    timestamps: true 
});

// Optimization: Indexing by teacher and date for fast report generation
attendanceSchema.index({ teacherId: 1, date: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;