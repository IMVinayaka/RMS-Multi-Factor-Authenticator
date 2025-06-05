import { useEffect, useState } from "react";
import TwoFASetup from "../../components/TwoFASetup";
import TwoFAVerify from "../../components/TwoFAVerify";
import styles from "./styles.module.scss";
import { loginUser } from "../../services/login";
import { toast } from "react-toastify";
import LoginWrapper from "@/components/loginWrapper";
import { useRouter } from "next/router";

import RadiantsLogo from "@/assets/radiants.png";
import IndainFlag from "@/assets/india.png";
import CandaFlag from "@/assets/canda.webp";
import USFlag from "@/assets/us.png";
import EuropeFlag from "@/assets/europe.webp";
import RadgovLogo from "@/assets/radGov.png";
import Orbitlogo from "@/assets/Orbit.png";

import RadGovbg from "@/assets/Radgov_Bg.jpg";
import AteecaLogo from "@/assets/ateeca-logo.png";
import AteecaBg from "@/assets/ateeca_bg.gif";
import radiantBg from "@/assets/radiant_bg.gif";
import FullScreenLoader from "@/components/Loader";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState(null);
  const [needs2FASetup, setNeeds2FASetup] = useState(false);
  const [needs2FAVerify, setNeeds2FAVerify] = useState(false);
  const [issuer, setIssuer] = useState("Radiant_India");
  const [loading, setLoading] = useState(true);

  const [wrapperDetails, setWrapperDetails] = useState({
    logo: RadiantsLogo,
    flag: IndainFlag,
    gradientColor: { start: "#003366", end: "#00cccc" },
    bgImage: radiantBg,
    aboutus: "https://www.radiants.com/about-us",
    privacyAndTerms: "https://www.radiants.com/privacy-policy",
    baseUrl: "https://intranet.radiants.com/RadInd/",
  });



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
      let obj = {
        username: username,
        password: password,
        userInstance: issuer,
      }
      setLoading(true);
      const data = await loginUser(obj);

      if (!data.secretKeyYN) {
        setTempToken(data);
        setNeeds2FASetup(true);
      } else {
        setTempToken(data);
        setNeeds2FAVerify(true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    }
    finally {
      setLoading(false);
    }
  };

  const data = [
    {
      instance: "RadGov_USA",
      logo: RadgovLogo,
      flag: USFlag,
      gradientColor: { start: "#06127a", end: "#2558b5" },
      bgImage: RadGovbg,
      aboutus: "https://www.radgov.com/aboutus",
      privacyAndTerms: "https://www.radgov.com/privacy-policy",
      baseUrl: "https://intranet.radgov.com/RadUS/"
    },
    {
      instance: "Ateeca_USA",
      logo: AteecaLogo,
      flag: USFlag,
      gradientColor: { start: "#d17f0b", end: "#f5ad46" },
      bgImage: AteecaBg,
      aboutus: "https://ateeca.com/about-us",
      privacyAndTerms: "https://ateeca.com/privacy",
      baseUrl: "https://intranet.radgov.com/RadUS/"
    },
    {
      instance: "Orbit",
      logo: Orbitlogo,
      flag: USFlag,
      gradientColor: { start: "#003366", end: "#00cccc" },
      bgImage: radiantBg,
      aboutus: "https://www.radiants.com/about-us",
      privacyAndTerms: "https://www.radiants.com/privacy-policy",
      baseUrl: "https://intranet.radiants.com/Orbit/",
    },
    {
      instance: "Radiant_India",
      logo: RadiantsLogo,
      flag: IndainFlag,
      gradientColor: { start: "#003366", end: "#00cccc" },
      bgImage: radiantBg,
      aboutus: "https://www.radiants.com/about-us",
      privacyAndTerms: "https://www.radiants.com/privacy-policy",
      baseUrl: "https://intranet.radiants.com/RadInd/",
    },
    {
      instance: "Radiant_Canada",
      logo: RadiantsLogo,
      flag: CandaFlag,
      gradientColor: { start: "#003366", end: "#00cccc" },
      bgImage: radiantBg,
      aboutus: "https://www.radiants.com/about-us",
      privacyAndTerms: "https://www.radiants.com/privacy-policy",
      baseUrl: "https://intranet.radiants.com/RadCA/",
    },
    {
      instance: "Radiant_USA",
      logo: RadiantsLogo,
      flag: USFlag,
      gradientColor: { start: "#003366", end: "#00cccc" },
      bgImage: radiantBg,
      aboutus: "https://www.radiants.com/about-us",
      privacyAndTerms: "https://www.radiants.com/privacy-policy",
      baseUrl: "https://intranet.radiants.com/RadUS/",

    },
    {
      instance: "Radiant_UK",
      logo: RadiantsLogo,
      flag: EuropeFlag,
      gradientColor: { start: "#003366", end: "#00cccc" },
      bgImage: radiantBg,
      aboutus: "https://www.radiants.com/about-us",
      privacyAndTerms: "https://www.radiants.com/about-us",
      baseUrl: "https://intranet.radiants.uk/RmsUKWeb/"
    },
  ];

  useEffect(() => {
    setLoading(true);

    if (router.isReady) {
      const instanceParam = router.query.Instance;
      const instance = instanceParam?.toString() || "Radiant_India";

      setIssuer(instance);

      const selected = data.find(
        (item) => item.instance.toLowerCase() === instance.toLowerCase()
      );

      if (selected) {
        setWrapperDetails(selected);

        // Set document title
        document.title = instance.replace(/_/g, " ");

        // Set favicon
        const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
        link.rel = "icon";
        link.href = selected.favicon;
        document.head.appendChild(link);
      }

      setTimeout(() => setLoading(false), 500);
    }
  }, [router.isReady, router.query]);


  return (
    <>

      {loading && <FullScreenLoader />}

      <LoginWrapper
        logo={wrapperDetails.logo}
        flag={wrapperDetails.flag}
        bgImage={wrapperDetails.bgImage}
        gradientColor={wrapperDetails.gradientColor}
        aboutus={wrapperDetails.aboutus}
        privacyAndTerms={wrapperDetails.privacyAndTerms}
      >

        {!needs2FASetup && !needs2FAVerify && (
          <>


            <div className={`${styles.loginContainer} ${styles.lightTheme}`}>
              <h2 className="text-white font-bold text-2xl text-center">Login</h2>

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



          </>

        )}

        {needs2FASetup && <TwoFASetup tempToken={tempToken} issuer={issuer} baseUrl={wrapperDetails?.baseUrl} />}
        {needs2FAVerify && <TwoFAVerify tempToken={tempToken} issuer={issuer} baseUrl={wrapperDetails?.baseUrl} />}
      </LoginWrapper>
    </>

  );
}
