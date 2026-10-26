const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

try {
  const app = initializeApp({ projectId: 'gridwise-c2eff' });
  console.log("App initialized");
  
  // Create a fake token just to see if getAuth() works
  getAuth(app).verifyIdToken('fake-token').catch(err => {
    console.log("verifyIdToken called, error:", err.message);
  });
} catch (e) {
  console.error("Init failed", e);
}
