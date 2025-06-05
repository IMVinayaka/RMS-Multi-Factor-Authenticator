import { useState } from "react";
import TwoFASetup from "../../components/TwoFASetup";
import TwoFAVerify from "../../components/TwoFAVerify";
import styles from "./styles.module.scss";
import { loginUser } from "../../services/login"; 
import { toast } from "react-toastify";
import LoginWrapper from "@/components/loginWrapper";


import RadiantsLogo from "@/assets/radiants.png";
import IndainFlag from "@/assets/india.png"; 
import CandaFlag from "@/assets/canda.webp";
import USFlag from "@/assets/us.png"; 
import EuropeFlag from "@/assets/europe.webp";
import RadgovLogo from "@/assets/radGov.png";
import Orbitlogo from "@/assets/Orbit.png";

import RadGovbg from "@/assets/Radgov_Bg.jpg";
import AteecaLogo from "@/assets/ateeca-logo.png";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState(null);
  const [needs2FASetup, setNeeds2FASetup] = useState(false);
  const [needs2FAVerify, setNeeds2FAVerify] = useState(false);
  const [theme, setTheme] = useState("light"); // light or dark
  const [wrapperDetails, setWrapperDetails] = useState({ logo: RadgovLogo, flag: USFlag, gradientColor: { start: "#06127a", end: "#2558b5" } ,bgImage: RadGovbg});

  const handleLogin = async () => {
    // Validate email (used as username)
    if (!username.trim()) {
      toast.error("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate password
    if (!password) {
      toast.error("Password is required");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      const data = await loginUser(username, password);

      if (!data.secretKeyYN) {
        setTempToken(data);
        setNeeds2FASetup(true);
      } else {
        setTempToken(data
        );
        setNeeds2FAVerify(true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    }
  };






  return (
    <LoginWrapper
      logo={wrapperDetails.logo}
      flag={wrapperDetails.flag}
        bgImage={wrapperDetails.bgImage}
      gradientColor={wrapperDetails.gradientColor}>
      
{!needs2FASetup && !needs2FAVerify && (
     <div
        className={`${styles.loginContainer} ${theme === "dark" ? styles.darkTheme : styles.lightTheme
          }`}
      >
        <h2 className="text-white font-bold text-2xl text-center" >Login</h2>

    

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
)}

{needs2FASetup && (
   <TwoFASetup tempToken={tempToken} />
)}
{needs2FAVerify && (
   <TwoFAVerify tempToken={tempToken} />
)}
 



    </LoginWrapper>

  );
}
