/**
 * Test script for Board App Clear Chats API
 * 
 * This script demonstrates how to call the clear chats API endpoint.
 * 
 * Usage:
 *   node scripts/test-clear-chats.js <firebase-id-token>
 * 
 * To get a Firebase ID token:
 *   1. Log in to the EASL app
 *   2. Open browser console
 *   3. Run: await firebase.auth().currentUser.getIdToken()
 *   4. Copy the token
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testClearChats(idToken) {
  console.log('🧪 Testing Board App Clear Chats API\n');
  console.log(`API URL: ${API_URL}/api/board-app/clear-chats`);
  console.log(`Token: ${idToken.substring(0, 20)}...\n`);

  try {
    console.log('📤 Sending request...');
    
    const response = await fetch(`${API_URL}/api/board-app/clear-chats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}\n`);

    const result = await response.json();
    
    console.log('📊 Response body:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log(`   Deleted ${result.deletedChats} chat(s)`);
      console.log(`   Deleted ${result.deletedMessages} message(s)`);
      
      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  Partial errors:');
        result.errors.forEach(err => console.log(`   - ${err}`));
      }
    } else {
      console.log('❌ FAILED!');
      console.log(`   Error: ${result.error}`);
      console.log(`   Message: ${result.message}`);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
  }
}

// Main execution
const idToken = process.argv[2];

if (!idToken) {
  console.error('❌ Error: Firebase ID token required\n');
  console.log('Usage:');
  console.log('  node scripts/test-clear-chats.js <firebase-id-token>\n');
  console.log('To get a Firebase ID token:');
  console.log('  1. Log in to the EASL app');
  console.log('  2. Open browser console');
  console.log('  3. Run: await firebase.auth().currentUser.getIdToken()');
  console.log('  4. Copy the token and pass it to this script\n');
  console.log('Example:');
  console.log('  node scripts/test-clear-chats.js eyJhbGciOiJSUzI1NiIsImtpZCI6...\n');
  process.exit(1);
}

testClearChats(idToken);
