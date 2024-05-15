'use client'

import NodeSelector from "@/app/_components/NodeSelector/NodeSelector"
import Flow from "./Flow"
import useRom, { useRomSelector } from "@/app/store/useRom"
import { shallow } from "zustand/shallow"

export interface ModuleDisplayProps {
  className: string
}

export const ModuleDisplay: React.FC<ModuleDisplayProps> = ({ className }) => {
  const {
    selectedRom,
  } = useRom(useRomSelector, shallow);

  return (
    <div
      className={`flex flex-col ${className}`}
    >
      <div className="text-sm">
        Selected Rom: {selectedRom?.name}
      </div>
      <Flow />
      <NodeSelector />
    </div>
  )
}

export default ModuleDisplay;
