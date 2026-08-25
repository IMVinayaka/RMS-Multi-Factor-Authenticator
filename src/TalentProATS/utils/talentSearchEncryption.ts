import CryptoJS from "crypto-js";

const TALENT_SEARCH_KEY = CryptoJS.enc.Utf8.parse("!#$a54?3");
const TALENT_SEARCH_IV = CryptoJS.enc.Hex.parse("1234567890abcdef");

/** Matches Encriotion.encryptQueryString in the legacy .NET application. */
export const encryptTalentSearchUserId = (userId: string | number) => {
  const encrypted = CryptoJS.DES.encrypt(String(userId), TALENT_SEARCH_KEY, {
    iv: TALENT_SEARCH_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
};
