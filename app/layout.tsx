"use client";
import "tailwindcss/tailwind.css";
import "../styles/globals.css";

import Sidebar from "./_components/Sidebar";
import ModuleDisplay from "./_components/ModuleDisplay";

export default function RootLayout() {
  return (
    <html lang="en" className="h-full">
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
