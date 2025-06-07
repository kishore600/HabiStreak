const admin = require('firebase-admin');
const path = require('path');

// Load service account
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

// Initialize app only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const sendFCM = async (fcmToken, title, body) => {
  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
  } catch (error) {
    console.error('❌ FCM Error:', error.message);
    throw error;
  }
};

const sendBulkFCM = async (fcmTokens, title, body) => {
  for (const token of fcmTokens) {
    const message = {
      token,
      notification: { title, body },
    };
    try {
      const response = await admin.messaging().send(message);
      console.log(`✅ Notification sent to ${token}: ${response}`);
    } catch (error) {
      console.error(`❌ Failed to send to ${token}:`, error.message);
    }
  }
};

const sendNotificationToTokens = async (tokens, title, body) => {
  if (!tokens.length) return;

  for (const token of tokens) {
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
      });
      console.log(`✅ Sent to ${token}`);
    } catch (err) {
      console.error(`❌ Error sending to ${token}:`, err.message);
    }
  }
};


module.exports = {
  sendFCM,
  sendBulkFCM,
  sendNotificationToTokens
};
