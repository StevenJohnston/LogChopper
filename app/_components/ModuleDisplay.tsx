'use client'

import NodeSelector from "@/app/_components/NodeSelector/NodeSelector"
import Flow from "./Flow"
import ColumnSelector from "./ColumnSelector"
import useRom, { useRomSelector } from "@/app/store/useRom"
import { shallow } from "zustand/shallow"
import { useEffect, useState } from "react"
import { formatter } from "@/app/_lib/utils"

export interface ModuleDisplayProps {
  className: string
}


export const ModuleDisplay: React.FC<ModuleDisplayProps> = ({ className }) => {
  const {
    selectedRom,
  } = useRom(useRomSelector, shallow);

  const [selectRomFileDate, setSelectedRomFileDate] = useState<Date>()
  useEffect(() => {
    (async () => {
      const file = await selectedRom?.getFile()
      if (file?.lastModified) {
        setSelectedRomFileDate(new Date(file.lastModified))
      }
    })()
  }, [selectedRom])

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${className}`}
    >
      <div className="text-sm px-2 py-0.5 bg-slate-200 border-b border-slate-300">
        Selected Rom: {selectedRom?.name} - {formatter.format(selectRomFileDate)}
      </div>
      <div className="grow relative w-full h-full overflow-hidden">
        <Flow />
        <NodeSelector />
      </div>
      <ColumnSelector />
    </div>
  )
}

export default ModuleDisplay;
