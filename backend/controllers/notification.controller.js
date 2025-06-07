// controllers/notification.controller.js
const { sendBulkFCM } = require('../services/fcmSender');

const notifyTaskComplete = async (req, res) => {
  try {
    const { fcmTokens, title, body } = req.body;

    if (!Array.isArray(fcmTokens) || fcmTokens.length === 0) {
      return res.status(400).json({ error: 'No FCM tokens provided' });
    }

    await sendBulkFCM(fcmTokens, title, body);

    res.status(200).json({ message: 'Notifications sent' });
  } catch (err) {
    console.error('Notification error:', err);
    res.status(500).json({ error: 'Failed to send notifications', details: err.message });
  }
};


module.exports = {
  notifyTaskComplete,
};
