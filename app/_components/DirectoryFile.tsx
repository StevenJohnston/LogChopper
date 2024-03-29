import { useEffect, useState } from "react"

export interface BaseDirectoryFileProps {
  multiSelect?: boolean
  handle?: FileSystemDirectoryHandle | FileSystemFileHandle | null
  selectedHandle?: FileSystemFileHandle | FileSystemFileHandle[] | null
  setSelectedHandle: (handle: FileSystemFileHandle) => void
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

function DirectoryFile({ multiSelect, handle, selectedHandle, setSelectedHandle }: DirectoryFileProps) {
  const [directoryFileList, setDiretoryFileList] = useState<(FileSystemFileHandle | FileSystemDirectoryHandle)[]>([])
  const [expanded, setExpanded] = useState<boolean>(false)
  useEffect(() => {
    (async () => {
      let directoryList = []
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
          📁 {handle.name}
        </button>
        <div>
          {
            expanded && directoryFileList.map((directoryFile) => {
              if (isSingleSelectDirectoryFile(selectedHandle)) {
                return <DirectoryFile multiSelect={false} handle={directoryFile} selectedHandle={selectedHandle} setSelectedHandle={setSelectedHandle} />
              } else {
                return <DirectoryFile multiSelect={true} handle={directoryFile} selectedHandle={selectedHandle} setSelectedHandle={setSelectedHandle} />
              }
            })
          }
        </div>
      </div>
    )
  }
  const selected = multiSelect ? selectedHandle?.includes(handle) : selectedHandle == handle;
  return (
    <button
      className={`whitespace-nowrap pl-2 ${selected ? 'selected' : ''} `}
      onClick={() => {
        setSelectedHandle(handle)
      }}
    >
      📃 {handle.name}
    </button>
  );
}

export default DirectoryFile;