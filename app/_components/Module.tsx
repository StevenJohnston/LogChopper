import { Scaling, Table } from "../_lib/rom-metadata";
import RomModuleUI from "./RomModuleUI";

export interface Module {
  table: Table
  type: 'base' | 'fill' | 'combine'
}

interface ModuleProps {
  module: Module
  selectedRom?: FileSystemFileHandle
  scalingMap?: Record<string, Scaling>
}

const ModuleUI: React.FC<ModuleProps> = ({
  selectedRom,
  scalingMap,
  module
}) => {
  if (module.type == 'base') {
    return (
      <div>
        <h1>{module.table.name}</h1>
        <RomModuleUI
          selectedRom={selectedRom}
          table={module.table}
          scalingMap={scalingMap}
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

export default ModuleUI;