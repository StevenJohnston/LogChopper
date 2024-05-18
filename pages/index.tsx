import Sidebar from "../src/_components/Sidebar";
import ModuleDisplay from "../src/_components/ModuleDisplay";
import Head from "next/head";

export default function RootLayout() {
  return (
    <div className="flex flex-row h-full">
      <Head>
        <title>Log Chopper</title>

      </Head>
      <Sidebar
        className="bg-slate-300 max-h-full"
      />
      <ModuleDisplay
        className="grow"
      />
    </div>
  );
}
