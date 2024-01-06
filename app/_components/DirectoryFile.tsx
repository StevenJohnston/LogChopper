import { useEffect, useState } from "react"

export interface DirectoryFileProps {
  handle?: FileSystemDirectoryHandle | FileSystemFileHandle
  selectedHandle?: FileSystemFileHandle
  setSelectedHandle: (handle: FileSystemFileHandle) => void
}

function DirectoryFile({ handle, selectedHandle, setSelectedHandle }: DirectoryFileProps) {
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
              return (
                <DirectoryFile handle={directoryFile} selectedHandle={selectedHandle} setSelectedHandle={setSelectedHandle} />
              )
            })
          }
        </div>
      </div>
    )
  }
  return (
    <button
      className={`whitespace-nowrap pl-2 ${selectedHandle == handle ? 'selected' : ''} `}
      onClick={() => {
        setSelectedHandle(handle)
      }}
    >
      📃 {handle.name}
    </button>
  );
}

export default DirectoryFile;