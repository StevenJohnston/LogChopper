import { Scaling, Table } from "../_lib/rom-metadata";
import RomModuleUI from "./RomModuleUI";

export interface Module {
  table: Table
  type: 'base' | 'fill' | 'combine'
}

interface ModuleProps {
  module: Module
}

const ModuleUI: React.FC<ModuleProps> = ({
  module
}) => {
  if (module.type == 'base') {
    return (
      <div>
        {/* <h1>{module.table.name}</h1> */}
        <RomModuleUI
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

export default ModuleUI;