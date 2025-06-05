"use client";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-gray-100 text-gray-800 font-sans">
      Redirecting to login...
    </div>
  );
}
