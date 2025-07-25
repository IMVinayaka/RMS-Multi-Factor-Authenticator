
import axiosInstance from "../network";
import { getBaseUrl } from "../network/helper";

// === 1. Login User ===
export const loginUser = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `${getBaseUrl("common")}/RMSAuthenticator/VerifyUser`,
     payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// === 2. Get 2FA Setup Details (Secret Key, etc.) ===
export const get2FASetup = async (token,userInstance,userEmail) => {
  try {
    const response = await axiosInstance.get(
      `${getBaseUrl("common")}/RMSAuthenticator/GenerateSecretKey/${token}?userEmail=${encodeURIComponent(userEmail)}&userInstance=${userInstance}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// === 3. Verify 2FA Code During Setup ===
export const verify2FASetup = async (payload, token) => {
  try {
    const response = await axiosInstance.post(
      `${getBaseUrl("common")}/RMSAuthenticator/VerifyCode?UserID=${token}`,
       payload 
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// === 4. Verify 2FA Login After Setup ===
export const verify2FALogin = async (otp, token) => {
  try {
    const response = await axiosInstance.post(
`${getBaseUrl("common")}/RMSAuthenticator/VerifyCode?UserID=${token}`,
       otp 
       
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const reset2FA = async (token, email, userInstance) => {
  return axiosInstance.post(
    `${getBaseUrl("common")}/RMSAuthenticator/Forgot2FA?UserID=${token}&userEmail=${encodeURIComponent(email)}&userInstance=${userInstance}`,
    {} // Send an empty POST body
  );
};

export const resetPassword = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `${getBaseUrl("common")}/RMSAuthenticator/RestRMSPassword`,
      payload
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const sendOTP = async ({userName, userInstance}) => {
  try {
    const response = await axiosInstance.post(
      `${getBaseUrl("common")}/RMSAuthenticator/ForgotRMSPassword?userName=${encodeURIComponent(userName)}&userInstance=${userInstance}`
    );
    return response;
  } catch (error) {
    throw error;
  }
}