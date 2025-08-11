import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import LoginWrapper from "@/components/loginWrapper";
import TwoFASetup from "../../components/TwoFASetup";
import TwoFAVerify from "../../components/TwoFAVerify";
import FullScreenLoader from "@/components/Loader";

import { loginUser } from "../../services/login";
import { setCookie } from "@/network/helper";

import {
  COMPANY_INSTANCES,
  DEFAULT_INSTANCE,
  emailRegex,
} from "../../utils/login.constants";

import styles from "./styles.module.scss";
import PasswordReset from "@/components/PasswordReset";

export default function LoginPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const [issuer, setIssuer] = useState(DEFAULT_INSTANCE);
  const [wrapperDetails, setWrapperDetails] = useState(
    COMPANY_INSTANCES.find((inst) => inst.instance === DEFAULT_INSTANCE)
  );

  const [ip, setIp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tempToken, setTempToken] = useState(null);
  const [needs2FASetup, setNeeds2FASetup] = useState(false);
  const [needs2FAVerify, setNeeds2FAVerify] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [error, setError] = useState(null);
  const [passwordReset, setPasswordReset] = useState(false);

  // Fetch user IP address
  useEffect(() => {
    async function fetchIP() {
      try {
        const response = await fetch("https://checkip.amazonaws.com");
        const text = await response.text();
        setIp(text.trim());
      } catch (err) {
        console.error("Error fetching IP:", err);
      }
    }
    fetchIP();
  }, []);

  // Handle dynamic company instance
  useEffect(() => {
    if (!router.isReady) return;

    const instance = router.query.Instance?.toString() || DEFAULT_INSTANCE;
    const selectedInstance = COMPANY_INSTANCES.find(
      (inst) => inst.instance.toLowerCase() === instance.toLowerCase()
    );

    if (selectedInstance) {
      setIssuer(instance);
      setWrapperDetails(selectedInstance);
      document.title = instance.replace(/_/g, " ");
      const favicon = document.querySelector("link[rel~='icon']") || document.createElement("link");
      favicon.rel = "icon";
      favicon.type = "image/png"; // <-- Add this line to specify the MIME type
      favicon.href = selectedInstance.logo;

      if (!favicon.parentNode) {
        document.head.appendChild(favicon);
      }


    }

    setTimeout(() => setLoading(false), 500);
  }, [router.isReady, router.query]);

  const validateInputs = () => {
    if (!userName.trim()) return "Email is required";
    if (!emailRegex.test(userName)) return "Please enter a valid email address";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters long";
    return null;
  };

  const handleLogin = async () => {
    const error = validateInputs();
    if (error) {
      toast.error(error);
      return;
    }

    const qsData = new URL(window?.location?.href).searchParams.get("qsd");

    try {
      setLoading(true);

      const loginPayload = {
        userName,
        password,
        userInstance: issuer,
        userIPAdress: ip,
        qsData: qsData,
      };

      const data = await loginUser(loginPayload);

      setCookie("token", data.token?.accessToken, data.token?.tokenExpiresInSeconds);

      const mFAVerificationYN = data?.mfaVerificationYN === true || data?.mfaVerificationYN === "true";
      const secretKeyGeneratedYN = data?.secretKeyGeneratedYN === true || data?.secretKeyGeneratedYN === "true";
      const ShowQRCodeYN = data?.showQRCodeYN === true || data?.showQRCodeYN === "true";

      if (!mFAVerificationYN) {
       toast.success("Verified! You will be rediercted to the application.");
        window.top.location.href = data?.url;
        setLoadingMessage('Loading dashboard, please wait...');
        setTimeout(() => {
          setLoading(false);
        }, 5000);
        return;
      }

      setTempToken(data);
      setNeeds2FASetup(!secretKeyGeneratedYN);
      setNeeds2FAVerify(secretKeyGeneratedYN);
      setHasAccess(ShowQRCodeYN);
      
      if (!ShowQRCodeYN && !secretKeyGeneratedYN) {
        toast.error("You do not have access to this instance.");
        return;
      }
      
    } catch (err) {
      setError(err?.response?.data || "Login failed");
      toast.error(err?.response?.data || "Login failed. Please try again.");
      if (err?.response?.status === 423) {
        setHasAccess(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  const renderLoginForm = () => (
    <div className={`${styles.loginContainer} ${styles.lightTheme}`}>
      <h2 className="text-white font-bold text-2xl text-center">Login</h2>
      <input
        placeholder="Username"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="submit"
        disabled={!userName.trim() || !password.trim()}
        onClick={handleLogin}

      >
        Login
      </button>
      <div className="text-white text-center mt-4">
        <p className="cursor-pointer" onClick={() => setPasswordReset(true)}>Forgot Password?</p>
      </div>
    </div>
  );

  const renderNoAccess = () => (
    <div className="text-white text-center mt-4 min-h-[10rem] flex flex-col items-center justify-center text-lg font-bold">
      {error}
    </div>
  );

  return (
    <>
      {loading && <FullScreenLoader />}

      <LoginWrapper {...wrapperDetails}>
        {!passwordReset && !needs2FASetup && !needs2FAVerify && hasAccess && renderLoginForm()}
        {!passwordReset && needs2FASetup && hasAccess && (
          <TwoFASetup tempToken={tempToken} issuer={issuer} baseUrl={wrapperDetails.baseUrl} />
        )}
        {!passwordReset && needs2FAVerify && hasAccess && (
          <TwoFAVerify tempToken={tempToken} issuer={issuer} baseUrl={wrapperDetails.baseUrl} />
        )}
        {!hasAccess && renderNoAccess()}


        {passwordReset && <PasswordReset instance={wrapperDetails?.instance} userName={userName} />}


      </LoginWrapper>
    </>
  );
}
