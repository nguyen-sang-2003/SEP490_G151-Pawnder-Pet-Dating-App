import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Store a string value in AsyncStorage
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {

    throw error;
  }
};

/**
 * Get a string value from AsyncStorage
 */
export const getItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {

    return null;
  }
};

/**
 * Remove a value from AsyncStorage
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {

    throw error;
  }
};

/**
 * Clear all AsyncStorage data
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {

    throw error;
  }
};

/**
 * Securely store credentials
 */
export const storeCredentials = async (
  username: string,
  password: string,
): Promise<boolean> => {
  try {
    await Keychain.setGenericPassword(username, password);
    return true;
  } catch (error) {

    return false;
  }
};

/**
 * Retrieve stored credentials
 */
export const getCredentials = async (): Promise<{
  username: string;
  password: string;
} | null> => {
  try {
    const credentials = await Keychain.getGenericPassword();
    if (credentials) {
      return {
        username: credentials.username,
        password: credentials.password,
      };
    }
    return null;
  } catch (error) {

    return null;
  }
};

/**
 * Remove stored credentials
 */
export const removeCredentials = async (): Promise<boolean> => {
  try {
    await Keychain.resetGenericPassword();
    return true;
  } catch (error) {

    return false;
  }
};

