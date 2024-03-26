import { Table } from "../_lib/rom-metadata";
import TableUI from "./TableUI";
import Surface from "./Surface";

interface RomModuleUIProps {
  table: Table
}

const RomModuleUI: React.FC<RomModuleUIProps> = ({ table }) => {
  // const [filledTableOld, setFilledTableOld] = useState<Table>()
  // useEffect(() => {
  //   if (!selectedRom || !table || !scalingMap) return
  //   (async () => {
  //     setFilledTableOld(await getFilledTableOld(selectedRom, scalingMap, table))
  //   })()
  // }, [selectedRom, table, scalingMap])
  // if (!table) return <div>loading table ui</div>
  return (
    <div>
      <TableUI
        table={table}
      />
      <Surface table={table} />
    </div>
  );
}

export default RomModuleUI;