'use client'

import { useEffect } from "react"
import ModuleUI, { Module } from "./Module"
import Flow from "./Flow"
import { Scaling } from "../_lib/rom-metadata"
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
