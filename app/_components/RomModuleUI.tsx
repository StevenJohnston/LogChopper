import { useEffect, useState } from "react";
import { Scaling, Table } from "../_lib/rom-metadata";
import TableUI from "./TableUI";
import { getFilledTable } from "../_lib/rom";
import Surface from "./Surface";

interface RomModuleUIProps {
  selectedRom: FileSystemFileHandle
  table: Table
  scalingMap: Record<string, Scaling>

}

const RomModuleUI: React.FC<RomModuleUIProps> = ({ selectedRom, table, scalingMap }) => {
  const [filledTable, setFilledTable] = useState<Table>()
  useEffect(() => {
    if (!selectedRom || !table || !scalingMap) return
    (async () => {
      setFilledTable(await getFilledTable(selectedRom, scalingMap, table))
    })()
  }, [selectedRom, table, scalingMap])
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