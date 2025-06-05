import { useState } from "react";
import styles from "./TwoFAVerify.module.scss";
import { verify2FALogin, reset2FA } from "../services/login";
import { toast } from "react-toastify";

export default function TwoFAVerify({ tempToken }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const verifyOtp = async () => {
    try {
      const res = await verify2FALogin(otp, tempToken?.userID);
      toast.success("2FA verified! You are logged in.");
      localStorage.setItem("accessToken", res.data.accessToken);
      window.location.href = "/";
    } catch {
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleReset = async () => {
    try {
      await reset2FA(tempToken?.userID);
      toast.success("2FA has been reset. Please log in again to reconfigure.");
      window.location.href = "/login";
    } catch (err) {
      toast.error("Failed to reset 2FA. Please try again later.");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className="font-bold text-2xl">Enter your 2FA code</h2>
      {error && <p className={styles.error}>{error}</p>}
      <input
        placeholder="Enter code from app"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className={styles.input}
      />
      <button onClick={verifyOtp} className={styles.button}>
        Verify
      </button>
      <button onClick={handleReset} className={styles.resetButton}>
        Reset Authenticator
      </button>
    </div>
  );
}
