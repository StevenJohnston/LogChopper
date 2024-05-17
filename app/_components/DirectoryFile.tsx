'use client'
import { useEffect, useState } from "react"

export interface BaseDirectoryFileProps {
  multiSelect?: boolean
  handle?: FileSystemDirectoryHandle | FileSystemFileHandle | null
  selectedHandle?: FileSystemFileHandle | FileSystemFileHandle[] | null
  setSelectedHandle: (handle: FileSystemFileHandle) => void
  fileTypes: string[]
  openRoot?: boolean
}

interface SingleSelectDirectoryFileProps extends BaseDirectoryFileProps {
  multiSelect: false
  selectedHandle?: FileSystemFileHandle | null
}

function isSingleSelectDirectoryFile(o: FileSystemFileHandle | FileSystemFileHandle[] | null | undefined): o is FileSystemFileHandle {
  return !Array.isArray(o)
}

interface MultiSelectDirectoryFileProps extends BaseDirectoryFileProps {
  multiSelect: true
  selectedHandle?: FileSystemFileHandle[] | null
}

type DirectoryFileProps = SingleSelectDirectoryFileProps | MultiSelectDirectoryFileProps

function DirectoryFile({ multiSelect, handle, selectedHandle, fileTypes, openRoot = true, setSelectedHandle }: DirectoryFileProps) {
  const [directoryFileList, setDiretoryFileList] = useState<(FileSystemFileHandle | FileSystemDirectoryHandle)[]>([])
  const [expanded, setExpanded] = useState<boolean>(openRoot)
  useEffect(() => {
    (async () => {
      const directoryList = []
      if (handle?.kind == 'directory') {
        for await (const entry of handle.values()) {
          directoryList.push(entry)
        }
        setDiretoryFileList(directoryList)
      }
    })()
  }, [handle])

  if (!handle) {
    return <div>Select File</div>
  }
  if (handle.kind === 'directory') {
    return (
      <div className="pl-2">
        <button
          className="whitespace-nowrap"
          onClick={() => {
            setExpanded(!expanded)
          }}
        >
          {expanded ? "📂" : "📁"} {handle.name}
        </button>
        <div>
          {
            expanded && directoryFileList.map((directoryFile) => {
              if (isSingleSelectDirectoryFile(selectedHandle)) {
                return <DirectoryFile key={directoryFile.name} multiSelect={false} handle={directoryFile} selectedHandle={selectedHandle} fileTypes={fileTypes} setSelectedHandle={setSelectedHandle} openRoot={false} />
              } else {
                return <DirectoryFile key={directoryFile.name} multiSelect={true} handle={directoryFile} selectedHandle={selectedHandle} fileTypes={fileTypes} setSelectedHandle={setSelectedHandle} openRoot={false} />
              }
            })
          }
        </div>
      </div>
    )
  }
  const selected = multiSelect ? selectedHandle?.includes(handle) : selectedHandle?.name == handle.name;

  if (!fileTypes.find(t => handle.name.endsWith(t))) {
    return
  }
  return (
    <button
      className={`block whitespace-nowrap pl-2 ${selected ? 'our-selected' : ''} `}
      onClick={() => {
        setSelectedHandle(handle)
      }}
    >
      📃 {handle.name}
    </button>
  );
}

export default DirectoryFile;