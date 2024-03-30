'use client'

import { useEffect, useState, useCallback } from "react"
import DirectoryFile from "./DirectoryFile"
import useFlow from "@/app/store/useFlow"
import { BASE_LOG_NODE_ID, BaseLogNodeType, INIT_BASE_LOG_NODE } from "@/app/_components/FlowNodes/BaseLogNode"
import { BaseTableNodeType, BaseTableType } from "@/app/_components/FlowNodes/BaseTableNode"

export interface SidebarProps {
  directoryHandle?: FileSystemDirectoryHandle | null
  setDirectoryHandle: (directoryHandle: FileSystemDirectoryHandle) => void
  setSelectedRomMetadataHandle: (FileSystemFileHandle: FileSystemFileHandle) => void
  selectedRomMetadataHandle?: FileSystemFileHandle | null
  setSelectedRom: (FileSystemFileHandle: FileSystemFileHandle) => void
  selectedRom?: FileSystemFileHandle | null
  className: string
  selectedLogs: FileSystemFileHandle[]
  setSelectedLogs: (selectedLogs: FileSystemFileHandle[]) => void
}

// TODO replace these props with useRom
export default function Sidebar({
  directoryHandle,
  setDirectoryHandle,
  setSelectedRomMetadataHandle,
  selectedRomMetadataHandle,
  setSelectedRom,
  selectedRom,
  selectedLogs,
  setSelectedLogs,
  className,
}: SidebarProps) {
  const [step, setStep] = useState<'metadata' | 'rom' | 'logs' | undefined>()
  const { nodes, updateNode } = useFlow()

  useEffect(() => {
    if (!selectedRomMetadataHandle) return
    setStep('rom')
  }, [selectedRomMetadataHandle])
  useEffect(() => {
    if (!selectedRom) return
    setStep('logs')
  }, [selectedRom])



  const onSelectRom = useCallback((selectedRom: FileSystemFileHandle) => {
    setSelectedRom(selectedRom)
    const existingBaseTableNodes = nodes.filter(n => n.type == BaseTableType) as BaseTableNodeType[]
    // TODO optimise this in a single call
    for (const n of existingBaseTableNodes) {
      n.data = {
        ...n.data,
        selectedRom: selectedRom
      }
      updateNode(n)
    }
  }, [nodes, setSelectedRom, updateNode])

  const onSelectLog = useCallback((selectedLog: FileSystemFileHandle) => {
    let newSelectedLogs = []
    if (selectedLogs.includes(selectedLog)) {
      newSelectedLogs = selectedLogs.filter(i => i !== selectedLog)
    } else {
      newSelectedLogs = [...selectedLogs, selectedLog]
    }
    setSelectedLogs(newSelectedLogs)
    const existingNode = nodes.find(n => n.id == BASE_LOG_NODE_ID) as BaseLogNodeType || INIT_BASE_LOG_NODE

    existingNode.data.selectedLogs = newSelectedLogs
    updateNode(existingNode)
  }, [nodes, selectedLogs, setSelectedLogs, updateNode])

  return (
    <div className={`flex flex-col ${className}`}>
      <button
        className="flex-grow-0 flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={async () => {
          const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
            // startIn: 'documents'
          });
          setDirectoryHandle(directoryHandle)
          setStep('metadata')
        }}
      >
        1. Select Directory
      </button>
      {
        // directoryHandle &&
        < div className="overflow-auto flex flex-grow-0 max-h-full pl-1  flex-col">
          <button
            className="bg-blue-100 w-full"
            onClick={() => {
              setStep('metadata')
            }}
          >
            2. Choose Rom Metadata
          </button>
          {
            // step == 'metadata'&& 
            <div className={`${step == 'metadata' ? '' : 'hidden'}`}>
              <DirectoryFile
                multiSelect={false}
                handle={directoryHandle}
                selectedHandle={selectedRomMetadataHandle}
                setSelectedHandle={setSelectedRomMetadataHandle}
              />
            </div>
          }
        </div>
      }
      {
        (selectedRomMetadataHandle)
        && < div className="overflow-auto flex flex-grow-0 max-h-full pl-1 flex-col">
          <button
            className="bg-blue-100 w-full"
            onClick={() => {
              setStep('rom')
            }}
          >
            3. Choose Rom
          </button>
          {
            // step == 'rom' &&
            <DirectoryFile
              multiSelect={false}
              handle={directoryHandle}
              selectedHandle={selectedRom}
              setSelectedHandle={onSelectRom}
            />
          }
        </div>
      }
      {
        (selectedRom)
        && < div className="overflow-auto flex flex-grow-0 max-h-full pl-1 flex-col">
          <button
            className="bg-blue-100 w-full"
            onClick={() => {
              setStep('logs')
            }}
          >
            3. Choose Log(s)
          </button>
          {
            step == 'logs'
            && <DirectoryFile
              multiSelect
              handle={directoryHandle}
              selectedHandle={selectedLogs}
              setSelectedHandle={onSelectLog}
            />
          }
        </div>
      }
    </div >
  )
}