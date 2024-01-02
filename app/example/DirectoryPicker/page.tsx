'use client'
export default function Page() {
  return <div>
    <button
      onClick={async () => {
        const directoryHandle = await window.showDirectoryPicker();

        for await (const entry of directoryHandle.values()) {
          console.log(entry.kind, entry.name);
        }

      }}
    >Directory Selector</button>
  </div>
}