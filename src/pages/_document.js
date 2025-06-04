import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <title>MFA Login</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content="MFA app with Next.js, Tailwind CSS, and Google Fonts" />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
