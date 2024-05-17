'use client'

import { useEffect, useState, useCallback } from "react"
import DirectoryFile from "./DirectoryFile"
import useFlow, { RFState } from "@/app/store/useFlow"
import { shallow } from "zustand/shallow"
import { BaseTableNodeType, BaseTableType } from "@/app/_components/FlowNodes/BaseTable/BaseTableTypes"
import { BaseLogNodeType, BaseLogType } from "@/app/_components/FlowNodes/BaseLog/BaseLogTypes"
import { v4 as uuid } from 'uuid'
import { newBaseLogData } from "@/app/_components/FlowNodes/BaseLog/BaseLogNode"
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


const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});

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
  const { nodes, updateNode } = useFlow(selector, shallow);

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
    const existingNode = nodes.find(n => n.type == BaseLogType) as BaseLogNodeType
    if (!existingNode) {
      updateNode({
        id: uuid(),
        type: BaseLogType,
        position: { x: 100, y: 100 },
        data: newBaseLogData({ selectedLogs: newSelectedLogs })
      })
      return
    }

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