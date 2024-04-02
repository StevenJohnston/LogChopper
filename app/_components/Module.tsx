import { forwardRef } from "react";
import { Table } from "../_lib/rom-metadata";
import RomModuleUI from "./RomModuleUI";

export interface Module {
  table: Table<unknown>
  type: 'base' | 'fill' | 'combine'
}

interface ModuleProps {
  module: Module
}

// const ModuleUI: React.FC<ModuleProps> = forwardRef(({
const ModuleUI = forwardRef<HTMLTextAreaElement, ModuleProps>(
  (
    { module },
    ref,
  ) => {
    if (module.type == 'base') {
      return (
        <div>
          {/* <h1>{module.table.name}</h1> */}
          <RomModuleUI
            ref={ref}
            table={module.table}
          />
        </div>
      )
    }
    return (
      <div>
        Undefined module type
      </div>
    );
  }
)

ModuleUI.displayName = "ModuleUI"

export default ModuleUI;