/**
 * Script to clear authentication data from AsyncStorage
 * This helps test the new user flow by removing stored tokens
 * 
 * Usage: 
 * - Import this in your app and call clearAuthData()
 * - Or use React Native Debugger console
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEYS = [
  '@veya:backend_token',
  '@veya:backend_user',
  '@veya:token',  // Legacy token key (if exists)
  '@veya:user',   // Legacy user key (if exists)
];

/**
 * Clear all authentication data from AsyncStorage
 */
export const clearAuthData = async () => {
  try {
    console.log('🧹 Clearing authentication data...');
    
    // Clear all auth-related keys
    await AsyncStorage.multiRemove(AUTH_KEYS);
    
    console.log('✅ Authentication data cleared successfully');
    console.log('📋 Cleared keys:', AUTH_KEYS.join(', '));
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    return false;
  }
};

/**
 * Clear all AsyncStorage data (use with caution)
 */
export const clearAllStorage = async () => {
  try {
    console.log('🧹 Clearing ALL AsyncStorage data...');
    
    const allKeys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(allKeys);
    
    console.log('✅ All AsyncStorage data cleared');
    console.log(`📋 Cleared ${allKeys.length} keys`);
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
    return false;
  }
};

/**
 * Check what auth data is currently stored
 */
export const checkAuthData = async () => {
  try {
    console.log('🔍 Checking stored authentication data...');
    
    const values = await AsyncStorage.multiGet(AUTH_KEYS);
    const data = {};
    
    values.forEach(([key, value]) => {
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      } else {
        data[key] = null;
      }
    });
    
    console.log('📊 Stored auth data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Error checking auth data:', error);
    return null;
  }
};

// Make functions available globally in dev mode
if (__DEV__) {
  global.clearAuthData = clearAuthData;
  global.clearAllStorage = clearAllStorage;
  global.checkAuthData = checkAuthData;
  
  console.log('🔧 Debug functions available:');
  console.log('  - clearAuthData() - Clear authentication tokens');
  console.log('  - clearAllStorage() - Clear all AsyncStorage data');
  console.log('  - checkAuthData() - Check stored auth data');
}

