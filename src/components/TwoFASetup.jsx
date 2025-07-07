import { useEffect, useState } from "react";
import QRCode from "qrcode";
import styles from "./TwoFASetup.module.scss";
import { get2FASetup, verify2FASetup } from "../services/login";
import { toast } from "react-toastify";
import { generateAuthUrl } from "@/utils/helper";
import FullScreenLoader from "./Loader";

export default function TwoFASetup({ tempToken, issuer, baseUrl }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [otp, setOtp] = useState("");
   const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function setup2FA() {
      try {
        setLoading(true);
        const res = await get2FASetup(tempToken.userID, issuer, tempToken.userName);
        if (!res) {
          toast.error("Failed to retrieve 2FA setup data");

          return;
        }
        let userName = tempToken?.userName;
        const cleanIssuer = issuer.replace(/_/g, " ").trim();
        const accountLabel = `${cleanIssuer}:${userName}`; // Must include colon between Issuer and UserName

        const otpAuthUrl = `otpauth://totp/${encodeURIComponent(accountLabel)}?secret=${res}&issuer=${encodeURIComponent(cleanIssuer)}&algorithm=SHA1&digits=6&period=30`;
        // Generate QR code
        const qr = await QRCode.toDataURL(otpAuthUrl, {
          type: "image/png",
          width: 250,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(qr);
      } catch (err) {
        toast.error("Failed to load QR code");
      }
      finally {
        setLoading(false);
      }
    }

    setup2FA();
  }, [tempToken]);

  const verifyOtp = async () => {
    let obj = {
      submittedCode: otp,
      userInstance: issuer,
    };
    try {
      setLoading(true);
      const res = await verify2FASetup(obj, tempToken?.userID);
      if (!res) {
        toast.error("Failed to verify OTP. Please try again.");
        return;
      }
      toast.success("2FA setup complete! You are logged in.");
      const url = generateAuthUrl(baseUrl, tempToken.userID);
      window.location.href = url;
    } catch (err) {
      toast.error("Invalid OTP. Please try again.");
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <>
        {loading && <FullScreenLoader />}

    <div c className={styles.container}>
      <h2 className="font-bold text-white text-center text-2xl">
        Scan from Authenticator
      </h2>

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
    </>
 
  );
}
