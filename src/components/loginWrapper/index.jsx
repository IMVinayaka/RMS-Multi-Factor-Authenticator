import React from "react";

const LoginWrapper = ({ logo, flag, gradientColor, children }) => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(to bottom right, ${gradientColor.start}, ${gradientColor.end})`,
      }}
    >
      {/* Header */}
      <div className="max-w-lg grid grid-cols-2 align-items-center p-6">
        <img className="cols-span-1" src={"data:image/png;base64,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"} alt="Logo"/>
       
       <h2 className="text-white text-4xl col-span-10 font-bold text-center w-full">Resource Mangement System</h2>
        {flag && <img src={flag} alt="Country Flag" className="h-8" />}
      </div>

      {/* World Map Background + Form */}
      <div className="relative w-full max-w-5xl flex justify-center items-center p-8">
        <div className="absolute inset-0">
          <img
            src="https://intranet.radiants.com/RadUS/images/Login/RMS_login_10.gif"
            alt="World Map"
            className="w-full h-full object-contain opacity-50"
          />
        </div>

        {/* Form box */}
        <div className="relative bg-white/20 backdrop-blur-md border border-white/40 rounded-lg p-8 shadow-lg w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-white text-sm text-center">
        <div className="space-x-4">
          <a href="#" className="underline">About</a>
          <a href="#" className="underline">Privacy Statement</a>
        </div>
        <p className="mt-2">&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LoginWrapper;
