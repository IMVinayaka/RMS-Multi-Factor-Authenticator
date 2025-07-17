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

export const DEFAULT_INSTANCE = "Radiant_India";

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const COMPANY_INSTANCES = [
  {
    instance: "RadGov_USA",
    logo: RadgovLogo,
    flag: USFlag,
    gradientColor: { start: "#06127a", end: "#2558b5" },
    bgImage: RadGovbg,
    aboutus: "https://www.radgov.com/aboutus",
    privacyAndTerms: "https://www.radgov.com/privacy-policy",
    baseUrl: "https://intranet.radgov.com/RadUS/",
    companyName: "RadGov.INC",
  },
  {
    instance: "Ateeca_USA",
    logo: AteecaLogo,
    flag: USFlag,
    gradientColor: { start: "#d17f0b", end: "#f5ad46" },
    bgImage: AteecaBg,
    aboutus: "https://ateeca.com/about-us",
    privacyAndTerms: "https://ateeca.com/privacy",
    baseUrl: "https://intranet.radgov.com/RadUS/",
    companyName: "Ateeca",
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
    companyName: "Radiants",
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
    companyName: "Radiants",
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
    companyName: "Radiants",
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
    companyName: "Radiants",
  },
  {
    instance: "Radiant_UK",
    logo: RadiantsLogo,
    flag: EuropeFlag,
    gradientColor: { start: "#003366", end: "#00cccc" },
    bgImage: radiantBg,
    aboutus: "https://www.radiants.com/about-us",
    privacyAndTerms: "https://www.radiants.com/about-us",
    baseUrl: "https://intranet.radiants.uk/RmsUKWeb/",
    companyName: "Radiants",
  },
];
