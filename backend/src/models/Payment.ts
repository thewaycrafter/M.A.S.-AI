import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
    },
    subscription: {
        tier: {
            type: String,
            enum: ['pro', 'enterprise'],
        },
        duration: {
            type: String,
            enum: ['monthly', 'yearly'],
        },
    },
}, {
    timestamps: true,
});

export const Payment = mongoose.model('Payment', paymentSchema);
