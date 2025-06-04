import { useEffect, useState } from "react";
import QRCode from "qrcode";
import styles from "./TwoFASetup.module.scss";
import { get2FASetup, verify2FASetup } from "../services/login";
import { toast } from "react-toastify";

export default function TwoFASetup({ tempToken }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function setup2FA() {
      try {
        const res = await get2FASetup(tempToken);
        console.log(res, '2FA Setup Response');
        const secret = res.data;
        let issuer = "RMSAuth"; // Default issuer
        let userid = tempToken;

        // Format: otpauth://totp/{issuer}:{userid}?secret={secret}&issuer={issuer}
        const otpAuthUrl = `otpauth://totp/${encodeURIComponent(
          issuer
        )}:${encodeURIComponent(userid)}?secret=${secret}&issuer=${encodeURIComponent(
          issuer
        )}&algorithm=SHA1&digits=6&period=30`;

        // Generate QR code
        const qr = await QRCode.toDataURL(otpAuthUrl);
        setQrCodeUrl(qr);
      } catch (err) {
        setError("Failed to load QR code");
      }
    }

    setup2FA();
  }, [tempToken]);

  const verifyOtp = async () => {
    try {
      const res = await verify2FASetup(otp, tempToken);
      toast.success("2FA setup complete! You are logged in.");
      localStorage.setItem("accessToken", res.data.accessToken);
      window.location.href = "/";
    } catch {
      setError("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Set up Two-Factor Authentication</h2>
      {error && <p className={styles.error}>{error}</p>}
      {qrCodeUrl ? (
        <>
          <img
            src={qrCodeUrl}
            alt="Scan this QR code with your Authenticator app"
            className={styles.qrCode}
          />
          <input
            placeholder="Enter code from app"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className={styles.input}
          />
          <button onClick={verifyOtp} className={styles.button}>
            Verify OTP
          </button>
        </>
      ) : (
        <p>Loading QR code...</p>
      )}
    </div>
  );
}
