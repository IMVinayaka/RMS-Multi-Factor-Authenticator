import "@/styles/globals.scss";
import "@/TalentProATS/styles/CommonAnalysis.css";
import "@/TalentProATS/styles/JobAnalysis.css";
import "@/TalentProATS/styles/ResumeAudit.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </>
  );
}
