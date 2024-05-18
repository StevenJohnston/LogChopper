import "tailwindcss/tailwind.css";
import "../styles/globals.css";

import Sidebar from "./_components/Sidebar";
import ModuleDisplay from "./_components/ModuleDisplay";
import Head from "next/head";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "LogChopper",
  description: "LogChopper",
  generator: "Next.js",
  manifest: "/LogChopper/manifest.json",
  keywords: ["LogChopper"],
  authors: [
    { name: "Steven Johnston" },
  ],
  icons: [
    { rel: "icon", url: "icon.png" },
  ],
};

export default function RootLayout() {
  return (
    <html lang="en" className="h-full">
      <Head>
        <title>Log Chopper</title>
      </Head>
      <body className="h-full">
        <div className="flex flex-row h-full">
          <Sidebar
            className="bg-slate-300 max-h-full"
          />
          <ModuleDisplay
            className="grow"
          />
        </div>
      </body>
    </html>
  );
}
