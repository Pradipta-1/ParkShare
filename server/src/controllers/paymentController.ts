import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Payment } from '../models/types.js';

export const createPaymentIntent = (req: AuthenticatedRequest, res: Response): void => {
  const { bookingId, amount, method = 'UPI' } = req.body;
  const user = req.user;

  if (!amount) {
    res.status(400).json({ success: false, message: 'Amount is required' });
    return;
  }

  const orderId = `order_${uuidv4().substring(0, 10)}`;

  res.json({
    success: true,
    orderId,
    amount,
    currency: 'INR',
    method,
    keyId: 'rzp_test_parkshare_demo_key',
    user: user ? { name: user.name, email: user.email, phone: user.phone } : undefined,
  });
};

export const verifyPayment = (req: AuthenticatedRequest, res: Response): void => {
  const { bookingId, amount, method = 'UPI' } = req.body;
  const user = req.user;

  const newPayment: Payment = {
    id: `pay_${uuidv4().substring(0, 8)}`,
    bookingId: bookingId || 'temp_booking',
    userId: user ? user.id : 'usr_driver_1',
    amount: Number(amount),
    method,
    transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
    status: 'success',
    createdAt: new Date().toISOString(),
  };

  dbStore.payments.push(newPayment);

  res.json({
    success: true,
    message: 'Payment verified and confirmed',
    data: newPayment,
  });
};
