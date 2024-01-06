'use client'

import { useEffect, useState } from "react"
import DirectoryFile from "./DirectoryFile"

export interface SidebarProps {
  directoryHandle?: FileSystemDirectoryHandle
  setDirectoryHandle: (directoryHandle: FileSystemDirectoryHandle) => void
  setSelectedRomMetadataHandle: (FileSystemFileHandle: FileSystemFileHandle) => void
  selectedRomMetadataHandle?: FileSystemFileHandle
  setSelectedRom: (FileSystemFileHandle: FileSystemFileHandle) => void
  selectedRom?: FileSystemFileHandle
  className: string
}

export default function Sidebar({
  directoryHandle,
  setDirectoryHandle,
  setSelectedRomMetadataHandle,
  selectedRomMetadataHandle,
  setSelectedRom,
  selectedRom,

  className,
}: SidebarProps) {
  const [step, setStep] = useState<'metadata' | 'rom' | 'logs' | undefined>()

  useEffect(() => {
    if (!selectedRomMetadataHandle) return
    setStep('rom')
  }, [selectedRomMetadataHandle])
  useEffect(() => {
    if (!selectedRom) return
    setStep('logs')
  }, [selectedRom])
  return (
    <div className={`flex flex-col ${className}`}>
      <button
        className="flex-grow-0 flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={async () => {
          const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
            startIn: 'documents'
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
              handle={directoryHandle}
              selectedHandle={selectedRom}
              setSelectedHandle={setSelectedRom}
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
            // step == 'logs'
            // && <DirectoryFile
            //   handle={directoryHandle}
            // selectedHandle={ }
            // setSelectedHandle={ }
            // />
          }
        </div>
      }
    </div >
  )
}