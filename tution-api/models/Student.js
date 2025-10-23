const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    name: { type: String, required: true, trim: true },
    grade: { type: String, required: true }, // "Grade 6", "Grade 7", etc.
    location: { type: String, required: true }, // "City A", "City B", etc.
    contactPhone: { type: String },
    parentName: { type: String },
    isActive: { type: Boolean, default: true } // So you can mark students as "inactive"
}, { timestamps: true }); // timestamps adds `createdAt` and `updatedAt`

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;