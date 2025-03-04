const cron = require('node-cron');
const moment = require('moment');
const TeacherWallet = require('../model/walletModel');
const Transaction = require('../model/transactionModel');
const SettlementHistory = require('../model/settlementHistoryModel');
const Booking = require('../model/bookingModel');
const Order = require('../model/orderModel');

// Run the cron job every Sunday at midnight
cron.schedule('0 0 * * 0', async () => {
  try {
    const startDate = moment().subtract(7, 'days').startOf('day').toDate(); // Last week's Monday
    const endDate = moment().subtract(1, 'days').endOf('day').toDate(); // Last week's Sunday

    // Fetch all completed tutoring sessions
    const completedSessions = await Booking.find({
      status: "completed",
      sessionDate: { $gte: startDate, $lte: endDate }
    });

    // Fetch all course purchases
    const courseOrders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Group earnings by teacher
    const teacherEarnings = {};

    // Calculate earnings for tutoring sessions
    for (const session of completedSessions) {
      if (!teacherEarnings[session.teacherId]) {
        teacherEarnings[session.teacherId] = 0;
      }
      const netEarnings = session.amount * 0.40; // 40% for teacher
      teacherEarnings[session.teacherId] += netEarnings;
    }

    // Calculate earnings for course purchases
    for (const order of courseOrders) {
      if (!teacherEarnings[order.teacherId]) {
        teacherEarnings[order.teacherId] = 0;
      }
      const netEarnings = order.amount * 0.60; // 60% for teacher
      teacherEarnings[order.teacherId] += netEarnings;
    }

    // Process settlements
    for (const [teacherId, amount] of Object.entries(teacherEarnings)) {
      if (amount > 0) {
        const wallet = await TeacherWallet.findOne({ teacherId });

        // If wallet doesn't exist, create one
        if (!wallet) {
          await TeacherWallet.create({ teacherId, balance: amount, withdrawableBalance: amount });
        } else {
          wallet.balance += amount;
          wallet.withdrawableBalance += amount;
          await wallet.save();
        }

        // Record settlement
        await SettlementHistory.create({
          teacherId,
          amount,
          weekStartDate: startDate,
          weekEndDate: endDate,
        });

        // Record transaction
        await Transaction.create({
          teacherId,
          amount,
          type: 'credit',
          description: 'Weekly settlement',
          weekStartDate: startDate,
          weekEndDate: endDate,
        });
      }
    }

    console.log('Weekly settlements processed successfully.');
  } catch (error) {
    console.error('Error processing weekly settlements:', error);
  }
});
