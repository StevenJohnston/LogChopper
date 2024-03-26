"use client";
import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import { useCallback, useEffect, useState } from "react";
import { shallow } from "zustand/shallow";

import Sidebar from "./_components/Sidebar";
import ModuleDisplay from "./_components/ModuleDisplay";
import { LoadRomMetadata, Scaling, Table } from "./_lib/rom-metadata";
import TableSelector from "./_components/TableSelector";
import { Module } from "./_components/Module";
import useRom, { useRomSelector } from "@/app/store/useRom";

async function findFileByName(
  directory: FileSystemDirectoryHandle,
  fileName: string
): Promise<FileSystemFileHandle | null> {
  try {
    for await (const entry of directory.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        if (file.name == fileName) {
          return entry;
        }
      } else if (entry.kind === "directory") {
        let foundFile = await findFileByName(entry, fileName);
        if (foundFile) return foundFile;
      }
    }
  } catch (e) {
    console.log(e);
  }
  return null;
}

export default function RootLayout() {
  const {
    directoryHandle,
    setDirectoryHandle,
    selectedRomMetadataHandle,
    setSelectedRomMetadataHandle,
    selectedRom,
    setSelectedRom,
    scalingMap,
    setScalingMap,
    tableMap,
    setTableMap,
    selectedLogs,
    setSelectedLogs
  } = useRom(useRomSelector, shallow);

  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    if (!directoryHandle) return;
    (async () => {
      // Load all metadata files

      // setRomMetadataMap(await getAllRomMetadataMap(directoryHandle))
      // Set selectedRomMetadata to default
      const defaultRomMetadata = await findFileByName(
        directoryHandle,
        "TephraMOD-59580304.xml"
      );
      if (!defaultRomMetadata) return;

      const { scalingMap, tableMap } = await LoadRomMetadata(
        directoryHandle,
        defaultRomMetadata
      );

      setScalingMap(scalingMap);
      setTableMap(tableMap);

      setSelectedRomMetadataHandle(defaultRomMetadata);
      const defaultRom = await findFileByName(
        directoryHandle,
        "Steven Johnston 2.0L 8474 ID1300 GSC S2 FR3.5 Intake 94 oct V3.17.00.6.srf"
      );
      if (defaultRom) {
        setSelectedRom(defaultRom);
      }
      // setSelectRom to default
    })();
  }, [directoryHandle]);

  useEffect(() => {
    if (!directoryHandle || !selectedRomMetadataHandle) return;
    (async () => {
      // Convert selected handler to RomMetadata
      // Load the file and get the rom id, use that id to build the table

      const { scalingMap, tableMap } = await LoadRomMetadata(
        directoryHandle,
        selectedRomMetadataHandle
      );
      setScalingMap(scalingMap);
      setTableMap(tableMap);
    })();
    setSelectedRom(null);
  }, [directoryHandle, selectedRomMetadataHandle]);

  useEffect(() => {
    if (!directoryHandle || !selectedRom) return;
    (async () => {
      // let file = await selectedRom.getFile()
      // let buffer = await file.arrayBuffer()
    })();
  }, [directoryHandle, selectedRom]);

  const addModule = useCallback(
    (module: Module) => {
      setModules([...modules, module]);
    },
    [modules, setModules]
  );

  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <div className="flex flex-row h-full">
          <Sidebar
            className="w-1/6 bg-slate-300 max-h-full"
            directoryHandle={directoryHandle}
            setDirectoryHandle={setDirectoryHandle}
            setSelectedRomMetadataHandle={setSelectedRomMetadataHandle}
            selectedRomMetadataHandle={selectedRomMetadataHandle}
            setSelectedRom={setSelectedRom}
            selectedRom={selectedRom}
            selectedLogs={selectedLogs}
            setSelectedLogs={setSelectedLogs}


          />
          <TableSelector
            scalingMap={scalingMap}
            tableMap={tableMap}
            addModule={addModule}
            className="w-1/6"
          />
          <ModuleDisplay
            className="w-4/6"
          />
        </div>
      </body>
    </html>
  );
}
