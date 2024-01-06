import { useEffect, useState } from "react";
import { Scaling, Table } from "../_lib/rom-metadata";
import TableUI from "./TableUI";
import { getFilledTable } from "../_lib/rom";
import Surface from "./Surface";

interface RomModuleUIProps {
  table: Table
  selectedRom?: FileSystemFileHandle
  scalingMap?: Record<string, Scaling>

}

const RomModuleUI: React.FC<RomModuleUIProps> = ({ selectedRom, table, scalingMap }) => {
  const [filledTable, setFilledTable] = useState<Table>()
  useEffect(() => {
    if (!selectedRom || !table || !scalingMap) return
    (async () => {
      setFilledTable(await getFilledTable(selectedRom, scalingMap, table))
    })()
  }, [selectedRom, table, scalingMap])
  if (!filledTable) return <div>loading table ui</div>
  return (
    <div>
      <TableUI
        table={filledTable}
      />
      <Surface table={filledTable} />
    </div>
  );
}

export default RomModuleUI;