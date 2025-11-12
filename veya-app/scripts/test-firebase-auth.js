/**
 * Test script to create/verify users in Firebase Emulator
 * Run with: node scripts/test-firebase-auth.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Initialize Firebase Admin (no credentials needed for emulator)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-veya',
  });
}

const auth = admin.auth();

async function createOrUpdateUser(email, password, displayName) {
  try {
    let user;
    
    // Try to get existing user
    try {
      user = await auth.getUserByEmail(email);
      console.log(`✅ User found: ${user.uid}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Display Name: ${user.displayName || 'Not set'}`);
      
      // Update password if provided
      if (password) {
        await auth.updateUser(user.uid, {
          password: password,
        });
        console.log(`✅ Password updated for user: ${email}`);
      }
      
      // Update display name if provided
      if (displayName) {
        await auth.updateUser(user.uid, {
          displayName: displayName,
        });
        console.log(`✅ Display name updated: ${displayName}`);
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create new user
        console.log(`📝 Creating new user: ${email}`);
        user = await auth.createUser({
          email: email,
          password: password,
          displayName: displayName,
          emailVerified: true,
        });
        console.log(`✅ User created: ${user.uid}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Display Name: ${user.displayName || 'Not set'}`);
      } else {
        throw error;
      }
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function listUsers() {
  try {
    const listUsersResult = await auth.listUsers();
    console.log('\n📋 All users in Firebase Emulator:');
    console.log('─'.repeat(50));
    
    if (listUsersResult.users.length === 0) {
      console.log('   No users found.');
    } else {
      listUsersResult.users.forEach((user) => {
        console.log(`   • ${user.email} (${user.uid})`);
        console.log(`     Display Name: ${user.displayName || 'Not set'}`);
        console.log(`     Created: ${user.metadata.creationTime}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

async function deleteUser(email) {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
    console.log(`✅ User deleted: ${email}`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`ℹ️  User not found: ${email}`);
    } else {
      console.error('❌ Error deleting user:', error.message);
    }
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🔥 Firebase Emulator Auth Test Script\n');
  console.log(`📍 Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}\n`);
  
  try {
    switch (command) {
      case 'create':
      case 'update': {
        const email = args[1] || 'khoinguyent@gmail.com';
        const password = args[2] || 'test123';
        const displayName = args[3] || 'Test User';
        
        await createOrUpdateUser(email, password, displayName);
        break;
      }
      
      case 'list': {
        await listUsers();
        break;
      }
      
      case 'delete': {
        const email = args[1] || 'khoinguyent@gmail.com';
        await deleteUser(email);
        break;
      }
      
      case 'reset': {
        const email = args[1] || 'khoinguyent@gmail.com';
        const password = args[2] || 'test123';
        const displayName = args[3] || 'Test User';
        
        console.log(`🔄 Resetting user: ${email}`);
        await deleteUser(email);
        await createOrUpdateUser(email, password, displayName);
        break;
      }
      
      default: {
        console.log('Usage:');
        console.log('  node scripts/test-firebase-auth.js create [email] [password] [displayName]');
        console.log('  node scripts/test-firebase-auth.js update [email] [password] [displayName]');
        console.log('  node scripts/test-firebase-auth.js list');
        console.log('  node scripts/test-firebase-auth.js delete [email]');
        console.log('  node scripts/test-firebase-auth.js reset [email] [password] [displayName]');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/test-firebase-auth.js create khoinguyent@gmail.com test123 "Test User"');
        console.log('  node scripts/test-firebase-auth.js reset khoinguyent@gmail.com test123');
        console.log('  node scripts/test-firebase-auth.js list');
        break;
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

