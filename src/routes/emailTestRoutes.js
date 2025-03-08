const express = require('express');
const router = express.Router();
const emailTestController = require('../controller/emailTestController');

/**
 * @route POST /api/email-test/booking-scheduled
 * @desc Test sending booking scheduled emails (initial booking stage)
 * @access Public (for testing purposes only)
 */
router.post('/booking-scheduled', emailTestController.testBookingScheduled);

/**
 * @route POST /api/email-test/booking-confirmation
 * @desc Test sending booking confirmation emails
 * @access Public (for testing purposes only)
 */
router.post('/booking-confirmation', emailTestController.testBookingConfirmation);

/**
 * @route POST /api/email-test/booking-cancellation
 * @desc Test sending booking cancellation emails
 * @access Public (for testing purposes only)
 */
router.post('/booking-cancellation', emailTestController.testBookingCancellation);

/**
 * @route POST /api/email-test/reschedule-request
 * @desc Test sending reschedule request emails
 * @access Public (for testing purposes only)
 */
router.post('/reschedule-request', emailTestController.testRescheduleRequest);

/**
 * @route POST /api/email-test/reschedule-confirmation
 * @desc Test sending reschedule confirmation emails
 * @access Public (for testing purposes only)
 */
router.post('/reschedule-confirmation', emailTestController.testRescheduleConfirmation);

/**
 * @route POST /api/email-test/reschedule-rejection
 * @desc Test sending reschedule rejection emails
 * @access Public (for testing purposes only)
 */
router.post('/reschedule-rejection', emailTestController.testRescheduleRejection);

module.exports = router;
