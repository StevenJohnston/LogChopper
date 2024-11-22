'use client'

import { useState, useCallback, useEffect } from "react"
import DirectoryFile from "./DirectoryFile"
import useFlow, { RFState } from "@/app/store/useFlow"
import { shallow } from "zustand/shallow"
import { BaseLogData, BaseLogNodeType, BaseLogType } from "@/app/_components/FlowNodes/BaseLog/BaseLogTypes"
import { v4 as uuid } from 'uuid'
import useRom, { useRomSelector } from "@/app/store/useRom";
import TableSelector from "@/app/_components/TableSelector"
import { BaseRomData, BaseRomType } from "@/app/_components/FlowNodes/BaseRom/BaseRomTypes"
import { set as idbSet, get as idbGet } from 'idb-keyval';

export interface SidebarProps {
  className: string
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});

export default function Sidebar({
  className,
}: SidebarProps) {

  const {
    metadataDirectoryHandle,
    setMetadataDirectoryHandle,
    romDirectoryHandle,
    setRomDirectoryHandle,
    logDirectoryHandle,
    setLogDirectoryHandle,

    selectedRomMetadataHandle,
    setSelectedRomMetadataHandle,
    selectedRom,
    setSelectedRom,
    selectedLogs,
    setSelectedLogs,

    scalingMap,
    tableMap,
  } = useRom(useRomSelector, shallow);

  const [step, setStep] = useState<'metadata' | 'rom' | 'logs' | 'tables' | undefined>()
  const { nodes, updateNode } = useFlow(selector, shallow);

  const onSelectLog = useCallback((selectedLog: FileSystemFileHandle) => {
    let newSelectedLogs = []
    if (selectedLogs.find(s => s.name == selectedLog.name)) {
      newSelectedLogs = selectedLogs.filter(s => s.name !== selectedLog.name)
    } else {
      newSelectedLogs = [...selectedLogs, selectedLog]
    }
    setSelectedLogs(newSelectedLogs)
    const existingNode = nodes.find(n => n.type == BaseLogType) as BaseLogNodeType
    if (!existingNode) {
      updateNode({
        id: uuid(),
        type: BaseLogType,
        position: { x: 100, y: 100 },
        data: new BaseLogData({}),
        dragHandle: '.drag-handle',
      })
      return
    }
  }, [nodes, selectedLogs, setSelectedLogs, updateNode])

  const openRomMetaDataSelect = useCallback(async () => {
    const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      id: "metadata"
    });
    setMetadataDirectoryHandle(directoryHandle)
    idbSet('metadataDirectoryHandle', directoryHandle)
  }, [setMetadataDirectoryHandle])

  const onMetadataSidebarClick = useCallback(async () => {
    if (step == "metadata") {
      setStep(undefined)
      return
    }
    setStep("metadata")

    if (!metadataDirectoryHandle) {
      openRomMetaDataSelect()
    }
  }, [step, metadataDirectoryHandle, openRomMetaDataSelect])

  const openRomSelect = useCallback(async () => {
    const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      id: "rom"
    });
    setRomDirectoryHandle(directoryHandle)
    idbSet('romDirectoryHandle', directoryHandle)
  }, [setRomDirectoryHandle])

  const onRomSideBarClick = useCallback(async () => {
    if (step == "rom") {
      setStep(undefined)
      return
    }
    setStep('rom')

    if (!romDirectoryHandle) {
      openRomSelect()
    }
  }, [step, romDirectoryHandle, openRomSelect])


  const openLogSelect = useCallback(async () => {
    const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      id: "log"
    });
    setLogDirectoryHandle(directoryHandle)
    idbSet('logDirectoryHandle', directoryHandle)
  }, [setLogDirectoryHandle])

  const onLogSideBarClick = useCallback(async () => {
    if (step == "logs") {
      setStep(undefined)
      return
    }
    setStep('logs')

    if (!logDirectoryHandle) {
      openLogSelect()
    }
  }, [step, logDirectoryHandle, openLogSelect])

  const onTablesSideBarClick = useCallback(() => {
    if (step == "tables") {
      setStep(undefined)
      return
    }
    setStep("tables")
  }, [step])

  const [selectedRomDate, setSelectedRomDate] = useState<Date>()
  useEffect(() => {
    (async () => {
      const romFile = await selectedRom?.getFile()
      if (romFile) {
        setSelectedRomDate(new Date(romFile.lastModified))
      }
    })()
  }, [selectedRom])

  const addSelectedRom = useCallback((file: FileSystemFileHandle) => {
    setSelectedRom(file)
    const existingNode = nodes.find(n => n.type == BaseRomType) as BaseLogNodeType
    if (!existingNode) {
      updateNode({
        id: uuid(),
        type: BaseRomType,
        data: new BaseRomData({}),
        position: { x: 300, y: 25 },
        dragHandle: '.drag-handle',
        // extent: 'parent',
      })
      return
    }
  }, [nodes, setSelectedRom, updateNode])

  // Attempt to load the last directory
  useEffect(() => {
    (async () => {
      try {
        const dbMetaDataDirectoryHandle = await idbGet('metadataDirectoryHandle')
        if (dbMetaDataDirectoryHandle) {
          setMetadataDirectoryHandle(dbMetaDataDirectoryHandle)
        }
      } catch (e) {
        console.log("It appears metaDataDirectoryHandle doesn't exists in the database", e)
      }
    })();
    (async () => {
      try {
        const dbRomDirectoryHandle = await idbGet('romDirectoryHandle')
        if (dbRomDirectoryHandle) {
          setRomDirectoryHandle(dbRomDirectoryHandle)
        }
      } catch (e) {
        console.log("It appears romDirectoryHandle doesn't exists in the database", e)
      }
    })();
    (async () => {
      try {
        const dbLogDirectoryHandle = await idbGet('logDirectoryHandle')
        if (dbLogDirectoryHandle) {
          setLogDirectoryHandle(dbLogDirectoryHandle)
        }
      } catch (e) {
        console.log("It appears logDirectoryHandle doesn't exists in the database", e)
      }
    })();
  }, [setMetadataDirectoryHandle, setRomDirectoryHandle, setLogDirectoryHandle])

  return (
    <div className={`flex flex-row ${className}`}>
      <div className="bg-slate-800 flex flex-col">
        <button
          className={`${step == "metadata" ? "bg-blue-500" : "bg-teal-500"} hover:bg-blue-700 text-white font-bold rounded w-12 h-12 content-center m-1`}
          onClick={onMetadataSidebarClick}
        >
          XMLs
        </button>
        <button
          className={`${step == "rom" ? "bg-blue-500" : "bg-teal-500"} hover:bg-blue-700 text-white font-bold rounded w-12 h-12 content-center m-1`}
          onClick={onRomSideBarClick}
        >
          Roms
        </button>
        <button
          className={`${step == "logs" ? "bg-blue-500" : "bg-teal-500"} hover:bg-blue-700 text-white font-bold rounded w-12 h-12 content-center m-1`}
          onClick={onLogSideBarClick}
        >
          Logs
        </button>
        <button
          className={`${step == "tables" ? "bg-blue-500" : "bg-teal-500"} hover:bg-blue-700 text-white font-bold rounded w-12 h-12 content-center m-1`}
          onClick={onTablesSideBarClick}
        >
          Table
        </button>
      </div>
      {
        step &&
        <div className="max-w-xs">
          {
            step == 'metadata' &&
            // <div className="overflow-auto flex flex-grow-0 h-full px-1 flex-col justify-between">
            <div className="h-full">
              <div className="flex flex-col justify-between h-full">

                {/* <div> */}
                <p className="text-lg text-center border-b-2 border-slate-500 mx-2">
                  Select Definition
                </p>
                <div className="grow overflow-auto">

                  <DirectoryFile
                    fileTypes={['.xml']}
                    multiSelect={false}
                    handle={metadataDirectoryHandle}
                    selectedHandle={selectedRomMetadataHandle}
                    setSelectedHandle={setSelectedRomMetadataHandle}
                  />
                </div>

                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white rounded mx-2 box-border px-2 my-1"
                  onClick={openRomMetaDataSelect}
                >
                  Reselected XML Directory
                </button>
              </div>
            </div>
          }
          {
            step == 'rom' &&
            <div className="h-full">
              <div className="flex flex-col justify-between h-full">

                <p className="text-lg text-center border-b-2 border-slate-500 mx-2">
                  Select Rom
                </p>
                <div className="grow overflow-auto">
                  <DirectoryFile
                    fileTypes={['.srf', '.bin']}
                    multiSelect={false}
                    handle={romDirectoryHandle}
                    selectedHandle={selectedRom}
                    setSelectedHandle={addSelectedRom}
                  />
                </div>

                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white  rounded mx-2 box-border px-2 my-1"
                  onClick={openRomSelect}
                >
                  Reselected Rom Directory
                </button>
              </div>
            </div>
          }
          {
            step == 'logs' &&
            <div className="h-full ">
              <div className="flex flex-col justify-between h-full">
                <p className="text-lg text-center border-b-2 border-slate-500 mx-2">
                  Select Logs
                </p>
                <div className="grow overflow-auto">
                  <DirectoryFile
                    fileTypes={['.csv']}
                    multiSelect
                    handle={logDirectoryHandle}
                    selectedHandle={selectedLogs}
                    setSelectedHandle={onSelectLog}
                    showDates={true}
                    showDatesAfter={selectedRomDate}
                  />
                </div>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white  rounded mx-2 box-border px-2 my-1"
                  onClick={openLogSelect}
                >
                  Reselected Logs Directory
                </button>
              </div>

            </div>
          }
          {
            step == 'tables' &&
            <TableSelector
              scalingMap={scalingMap}
              tableMap={tableMap}
            />
          }
        </div>
      }
    </div >
  )
}
