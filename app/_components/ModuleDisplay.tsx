'use client'

import { useEffect, useMemo, useState } from "react"
import ModuleUI, { Module } from "./Module"
import { Scaling } from "../_lib/rom-metadata"

export interface ModuleDisplayProps {
  selectedRom: FileSystemFileHandle
  modules: Module[]
  scalingMap: Record<string, Scaling>
  className: string
}

export const ModuleDisplay: React.FC<ModuleDisplayProps> = ({ selectedRom, modules, scalingMap, className }) => {
  useEffect(() => {
    (async () => {
      // const file = await selectedRom.getFile()
      // file.
    })()
  }, [selectedRom])
  return (
    <div
      className={className}
    >
      <div>
        Selected Rom: {selectedRom?.name}
      </div>

      Module Display
      <div>
        {
          modules.map((module) => {
            return (
              <ModuleUI
                key={module?.table?.name}
                selectedRom={selectedRom}
                scalingMap={scalingMap}
                module={module}
              />
            )
          })
        }
      </div>
    </div>
  )
}

export default ModuleDisplay;
