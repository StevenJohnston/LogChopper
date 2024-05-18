import "tailwindcss/tailwind.css";
import "../styles/globals.css";

// import "tailwindcss/tailwind.css";
// import "../styles/globals.css";

// import Sidebar from "../src/_components/Sidebar";
// import ModuleDisplay from "../src/_components/ModuleDisplay";

// import type { Metadata } from "next";


// export const metadata: Metadata = {
//   title: "LogChopper",
//   description: "LogChopper",
//   generator: "Next.js",
//   manifest: "/manifest.json",
//   keywords: ["LogChopper"],
//   themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
//   authors: [
//     { name: "Steven Johnston" },
//   ],
//   viewport:
//     "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
//   icons: [
//     { rel: "icon", url: "icon.png" },
//   ],
// };

// export default function RootLayout() {
//   return (
//     <html lang="en" className="h-full">=
//       <body className="h-full">
//         <div className="flex flex-row h-full">
//           lol
//           {/* <Sidebar
//             className="bg-slate-300 max-h-full"
//           />
//           <ModuleDisplay
//             className="grow"
//           /> */}
//         </div>
//       </body>
//     </html>
//   );
// }

import type { AppProps } from 'next/app';


const MyApp = ({ Component, pageProps }: AppProps) => (
  <Component {...pageProps} />
);

export default MyApp;