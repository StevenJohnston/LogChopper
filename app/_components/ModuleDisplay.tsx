'use client'

import NodeSelector from "@/app/_components/NodeSelector/NodeSelector"
import Flow from "./Flow"
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
      className={`flex flex-col ${className}`}
    >
      <div className="text-sm">
        Selected Rom: {selectedRom?.name} - {formatter.format(selectRomFileDate)}
      </div>
      <Flow />
      <NodeSelector />
    </div>
  )
}

export default ModuleDisplay;
