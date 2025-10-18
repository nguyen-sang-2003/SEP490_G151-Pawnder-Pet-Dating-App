import * as Keychain from 'react-native-keychain';

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
    console.error('Error storing credentials:', error);
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
    console.error('Error getting credentials:', error);
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
    console.error('Error removing credentials:', error);
    return false;
  }
};

