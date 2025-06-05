import axios from "axios";
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
export const get2FASetup = async (token,userInstance) => {
  try {
    const response = await axios.get(
      `${getBaseUrl("common")}/RMSAuthenticator/GenerateSecretKey/${token}?userInstance=${userInstance}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// === 3. Verify 2FA Code During Setup ===
export const verify2FASetup = async (payload, token) => {
  try {
    const response = await axios.post(
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
    const response = await axios.post(
`${getBaseUrl("common")}/RMSAuthenticator/VerifyCode?UserID=${token}`,
       otp 
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const reset2FA = async (token,userInstance) => {
  return axios.post(
    `/RMSAuthenticator/Forgot2FA?UserID=${token}&userInstance=${userInstance}`,

  );
};