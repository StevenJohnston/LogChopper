import { Table } from "../_lib/rom-metadata";
import TableUI from "./TableUI";
import Surface from "./Surface";
import { forwardRef, useState } from "react";

interface RomModuleUIProps {
  table: Table<string | number>
}

const RomModuleUI = forwardRef<HTMLTextAreaElement, RomModuleUIProps>(({ table }, ref) => {
  const [showSurface, setShowSurface] = useState<boolean>(false)

  return (
    <div className="flex flex-col items-end">
      <div className="flex flex-row">
        <TableUI
          table={table}
          ref={ref}
        />
        {
          showSurface && table.type == "3D" &&
          <div className="my-auto w-[500px]">
            <Surface table={table} />
          </div>
        }
      </div>
      {
        table.type == "3D" &&
        <button className='border-2 border-black w-8 h-8 mt-1'
          onClick={() => setShowSurface(!showSurface)}
        >
          {showSurface ? "<" : ">"}
        </button>
      }
    </div>
  );
})

RomModuleUI.displayName = "RomModuleUI"

export default RomModuleUI;