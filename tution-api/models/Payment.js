const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    // --- MULTI-TENANT FIELD ---
    // Links this payment record to a specific teacher account
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

    // --- Payment Details ---
    month: { 
        type: String, 
        required: true 
    }, // e.g., "October"
    year: { 
        type: Number, 
        required: true 
    }, // e.g., 2026
    amount: { 
        type: Number 
    },
    status: { 
        type: String, 
        enum: ['Paid', 'Pending', 'Overdue'], 
        default: 'Pending' 
    }
}, { 
    timestamps: true 
});

// This index ensures that for a specific teacher, a student 
// can only have one payment record per month/year.
paymentSchema.index({ teacherId: 1, student: 1, month: 1, year: 1 }, { unique: true });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;


