import { useState } from "react";
import TwoFASetup from "../../components/TwoFASetup";
import TwoFAVerify from "../../components/TwoFAVerify";
import styles from "./styles.module.scss";
import { loginUser } from "../../services/login"; // Adjust the import path as needed
import { toast } from "react-toastify";
import LoginWrapper from "@/components/loginWrapper";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState(null);
  const [needs2FASetup, setNeeds2FASetup] = useState(false);
  const [needs2FAVerify, setNeeds2FAVerify] = useState(false);
  const [theme, setTheme] = useState("light"); // light or dark

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
      console.log(data, '>>>>>>>>>>>>>>>>>>>>>')

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


  if (needs2FASetup) {
    return <TwoFASetup tempToken={tempToken} />;
  }

  if (needs2FAVerify) {
    return <TwoFAVerify tempToken={tempToken} />;
  }

  return (
   <LoginWrapper 
   
    gradientColor={{ start: "#003366", end: "#00cccc" }}>
      

   <div
      className={`${styles.loginContainer} ${theme === "dark" ? styles.darkTheme : styles.lightTheme
        }`}
    >
      <h2>Login</h2>

      {/* Toggle theme button */}
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        style={{
          marginBottom: 15,
          background: "transparent",
          border: "1px solid currentColor",
          cursor: "pointer",
          borderRadius: 4,
          padding: "5px 10px",
          alignSelf: "flex-end",
        }}
      >
        Switch to {theme === "light" ? "Dark" : "Light"} Theme
      </button>

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
   </LoginWrapper> 
 
  );
}
