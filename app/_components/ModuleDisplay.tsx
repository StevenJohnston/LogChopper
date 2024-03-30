'use client'

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
    </div>
  )
}

export default ModuleDisplay;
