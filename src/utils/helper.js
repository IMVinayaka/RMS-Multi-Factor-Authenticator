import CryptoJS from "crypto-js";

export function generateAuthUrl(baseUrl, userId) {
  const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY;
  if (!secretKey) throw new Error("Missing secret key in environment variables");

  // Format timestamp as MMDDYYYYHHSS
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const timestamp = `${pad(now.getMonth() + 1)}${pad(now.getDate())}${now.getFullYear()}${pad(now.getHours())}${pad(now.getSeconds())}`;

  const rawId = `${userId}${timestamp}`;

  // Encrypt using AES
  const encrypted = CryptoJS.AES.encrypt(rawId, secretKey).toString();
  const encodedId = encodeURIComponent(encrypted);
  console.log(rawId,' rawId');
  console.log(encodedId,' encodedId');

  return `${baseUrl}LoginAuth.aspx?id=${encodedId}&type=Auth2`;
}
