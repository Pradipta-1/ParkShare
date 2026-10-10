import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: './.env' });

async function testAllCollections() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // 1. Driver Login
  const dLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver@parkshare.com', password: 'password123' })
  })).json();
  const dToken = dLogin.token;

  // 2. Favorite spot (POST /api/favorites)
  const favRes = await (await fetch('http://localhost:5000/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + dToken },
    body: JSON.stringify({ parkingId: 'park_tollygunge_01' })
  })).json();
  console.log('1. Favorite toggled:', favRes.success, 'isFavorited:', favRes.isFavorited);

  // 3. Send Message (POST /api/messages)
  const msgRes = await (await fetch('http://localhost:5000/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + dToken },
    body: JSON.stringify({
      bookingId: 'book_tollygunge_demo',
      text: 'Hi host, is the bay clear for entry?',
      receiverId: 'usr_owner_1'
    })
  })).json();
  console.log('2. Message sent:', msgRes.success, 'id:', msgRes.data?.id);

  // 4. Host Login & Request Payout & Create Listing (which creates Verification Request)
  const oLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@parkshare.com', password: 'password123' })
  })).json();
  const oToken = oLogin.token;

  const payRes = await (await fetch('http://localhost:5000/api/owner/payouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + oToken },
    body: JSON.stringify({
      amount: 3500,
      paymentMethod: 'UPI',
      accountDetails: 'owner@okaxis'
    })
  })).json();
  console.log('3. Payout requested:', payRes.success, 'id:', payRes.data?.id);

  // Create Listing to trigger Verification Request
  const spaceRes = await (await fetch('http://localhost:5000/api/parking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + oToken },
    body: JSON.stringify({
      title: 'New Town Prime Driveway',
      description: 'Private gated driveway in New Town',
      address: 'Action Area II, New Town',
      city: 'Kolkata',
      pricePerHour: 50,
      parkingType: 'Driveway',
    })
  })).json();
  console.log('4. Listing created & verification triggered:', spaceRes.success, 'spaceId:', spaceRes.data?.id);

  // 5. Submit Incident Report
  const repRes = await (await fetch('http://localhost:5000/api/admin/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + dToken },
    body: JSON.stringify({
      parkingId: 'park_tollygunge_01',
      parkingTitle: 'Tollygunge Parking Spot',
      reason: 'Vehicle overstayed in bay',
      category: 'Parking unavailable',
      details: 'Vehicle occupied spot beyond allocated departure time.'
    })
  })).json();
  console.log('5. Report created:', repRes.success, 'id:', repRes.data?.id);

  // 6. Direct Verification in MongoDB Atlas
  console.log('\n--- DIRECT MONGODB ATLAS VERIFICATION ---');
  const collections = ['favorites', 'messages', 'notifications', 'payouts', 'verification_requests', 'reports'];
  for (const c of collections) {
    const count = await db.collection(c).countDocuments();
    const sample = await db.collection(c).findOne({});
    console.log(`Collection [${c}]: ${count} documents. Sample ID: ${sample?.id || sample?._id}`);
  }

  process.exit(0);
}

testAllCollections().catch(e => { console.error(e); process.exit(1); });
