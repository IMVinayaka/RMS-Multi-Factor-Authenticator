import Image from "next/image";
import React from "react";

const LoginWrapper = ({ logo, flag, gradientColor,bgImage, children,aboutus,privacyAndTerms }) => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(to bottom right, ${gradientColor.start}, ${gradientColor.end})`,
      }}
    >
      <div className="flex flex-col items-center justify-center max-w-5xl h-full  rounded-lg  backdrop-blur-md border border-white/40 ">
    {/* Header */}
      <div   style={{
        overflow: 'hidden',
        borderRadius: '8px 8px 0 0',
        background: `linear-gradient(to bottom right, ${gradientColor.start}, ${gradientColor.end})`,
      }} className="w-full border-b-0  gap-10  flex items-center  overflow-hidden justify-between p-6">
        <Image width={100} className="h-16" src={logo} alt="Logo"/>
       
       <h2 className="text-white text-4xl col-span-10 font-bold text-center w-full">Resource Mangement System</h2>

         <Image width={100} src={flag} alt="Country Flag" className="h-12" />
      </div>

      {/* World Map Background + Form */}
      <div className="relative w-full flex justify-center items-center p-8">
        <div className="absolute inset-0">
          <Image
            src={bgImage}
            alt="World Map"
            width={1920}
            height={1080}
            className="w-full h-full object-cover opacity-50"
          />
        </div>

        {/* Form box */}
        <div className="relative bg-white/20 backdrop-blur-md border border-white/40 rounded-lg p-8 shadow-lg w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer    style={{
        overflow: 'hidden',
       borderRadius: '0 0 8px 8px',
        background: `linear-gradient(to bottom right, ${gradientColor.start}, ${gradientColor.end})`,
      }} className="p-4 w-full h-full text-white text-sm text-center">
        <div className="space-x-4">
          <a href={aboutus} target="_blank" className="underline">About</a>
          <a href={privacyAndTerms} target="_blank"  className="underline">Privacy Statement</a>
        </div>
        <p className="mt-2">&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
      </footer>
      </div>
  
    </div>
  );
};

export default LoginWrapper;
