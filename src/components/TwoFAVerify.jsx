import { useState } from "react";
import styles from "./TwoFAVerify.module.scss";
import { verify2FALogin, reset2FA } from "../services/login";
import { toast } from "react-toastify";
import { generateAuthUrl } from "@/utils/helper";
import FullScreenLoader from "./Loader";

export default function TwoFAVerify({ tempToken, issuer, baseUrl }) {
  const [otp, setOtp] = useState("");
   const [loading, setLoading] = useState(false);

  const verifyOtp = async () => {
    try {
      setLoading(true);
      const resp = await verify2FALogin({ submittedCode: otp }, tempToken?.userID);
      if (resp === true) {
        toast.success("2FA verified! You will be rediercted to the application.");
        const url = generateAuthUrl(baseUrl, tempToken.userID);
        window.location.href = url;
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    } catch {
      toast.error("Invalid OTP. Please try again.");
    }finally{
      setLoading(false);

    }
  };

  const handleReset = async () => {
    try {
        setLoading(true);
      await reset2FA(tempToken?.userID, issuer);
      toast.success("2FA has been reset. Please log in again to reconfigure.");
      window.location.href = "/login";
    } catch (err) {
      toast.error("Failed to reset 2FA. Please try again later.");
    }
    finally{
      setLoading(false);
    }
  };

  return (
<>

     {loading && <FullScreenLoader />}
    <div className={styles.container}>
      <h2 className="font-bold text-2xl">Enter your 2FA code</h2>

      <input
        placeholder="Enter code from app"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className={styles.input}
      />
      <button disabled={!otp.trim()}  onClick={verifyOtp} className={styles.button}>
        Verify
      </button>
      <button onClick={handleReset} className={styles.resetButton}>
        Reset Authenticator
      </button>
    </div>
</>

  );
}
