import { memo, useMemo, useState } from 'react';
import { NodeProps } from 'reactflow';
import useFlow, { RFState } from '@/app/store/useFlow';
import { CustomHandle } from '../CustomHandle/CustomHandle';
import { Table } from '@/app/_lib/rom';
import { TableRemapData, TableRemapAxis, TableRemapSource, TableRemapNodeType, TableRemapType } from './TableRemapTypes';
import TableUI from '@/app/_components/TableUI';
import InfoSVG from '../../../icons/info.svg';
import Code from '@/app/_components/Code';
import { shallow } from 'zustand/shallow';

const axisOptions: { value: TableRemapAxis, label: string }[] = [
  { value: 'x', label: 'X-Axis' },
  { value: 'y', label: 'Y-Axis' },
];

const sourceOptions: { value: TableRemapSource, label: string }[] = [
  { value: 'x', label: 'X-Axis' },
  { value: 'y', label: 'Y-Axis' },
  { value: 'v', label: 'Values' },
];

const selector = (state: RFState) => ({
    updateTableRemapNodeConfig: state.updateTableRemapNodeConfig,
});

function TableRemapNode({ id, data }: NodeProps<TableRemapData>) {
  const { updateTableRemapNodeConfig } = useFlow(selector, shallow);
  const outputTable = data.output;

  const handleUpdate = (config: Partial<TableRemapData>) => {
    updateTableRemapNodeConfig(id, config);
  };

  const [expanded, setExpanded] = useState<boolean>(false)

  return (
    <div className="flex flex-col border border-gray-500 rounded-md p-2 bg-sky-500/75">
      <div className="flex items-center justify-between drag-handle">
        <h1 className="text-lg font-bold">Table Remap</h1>
        <div className='flex'>
          <div className=''>
            <InfoSVG
              className='mx-2 anchor'
              width={24}
              height={24}
            />
            <div className='tooltip'>
              <div className='bg-white rounded-lg p-4 min-w-[600px] border-black border-2'>
                <p className='text-2xl'>Table Remap</p>
                <p className='pl-2 mb-2'>Creates a new table by looking up values from another table. It takes the axes from a "Structure" table (A) and fills the values by finding data in a "Lookup" table (B).</p>
                <p className='text-lg'>Example: Transform <Code>LOAD = f(RPM, MAP)</Code> into <Code>MAP = g(RPM, LOAD)</Code></p>
                <p className='pl-2'><Code>Table A (Structure)</Code>: Axes (RPM, Load)</p>
                <p className='pl-2 mb-2'><Code>Table B (Lookup)</Code>: Axes (RPM, MAP), Values (Load)</p>
                <p className='text-2xl'>Configuration</p>
                <p className='pl-2'><Code>Common Axis</Code>: The axis that both tables share (e.g., RPM).</p>
                <p className='pl-2'><Code>Lookup Value (from A)</Code>: The value from the Structure table that will be used to search in the Lookup table (e.g., Load).</p>
                <p className='pl-2'><Code>Search Target (in B)</Code>: The axis or values in the Lookup table to search against (e.g., searching the Load values).</p>
                <p className='pl-2'><Code>Output Source (from B)</Code>: The axis or values in the Lookup table to use for the new table's values (e.g., getting the corresponding MAP value).</p>
              </div>
            </div>
          </div>
          <button className='border-2 border-gray-400 w-8 h-8'
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "_" : "V"}
          </button>
        </div>
      </div>

      <CustomHandle dataType='3D' type="target" position="left" id="a" title="Structure (A)" top="20px" />
      <CustomHandle dataType='3D' type="target" position="left" id="b" title="Lookup (B)" top="60px" />
      <CustomHandle dataType='3D' type="source" position="right" id="output" />

      <div className="grid grid-cols-2 gap-2">
        <div>
            <label className="block mb-2 text-sm font-medium text-white">Common Axis</label>
            <select 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={data.commonAxis} 
                onChange={(e) => handleUpdate({ commonAxis: e.target.value as TableRemapAxis })}
            >
                {axisOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
        <div>
            <label className="block mb-2 text-sm font-medium text-white">Lookup Value (from A)</label>
            <select 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={data.lookupValueSource} 
                onChange={(e) => handleUpdate({ lookupValueSource: e.target.value as TableRemapAxis })}
            >
                {axisOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
        <div>
            <label className="block mb-2 text-sm font-medium text-white">Search Target (in B)</label>
            <select 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={data.searchTarget} 
                onChange={(e) => handleUpdate({ searchTarget: e.target.value as TableRemapSource })}
            >
                {sourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
        <div>
            <label className="block mb-2 text-sm font-medium text-white">Output Source (from B)</label>
            <select 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={data.outputSource} 
                onChange={(e) => handleUpdate({ outputSource: e.target.value as TableRemapSource })}
            >
                {sourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
      </div>

      {outputTable && expanded && (
        <div className="mt-2">
          <h2 className="text-md font-semibold">Output Table</h2>
          <TableUI table={outputTable} />
        </div>
      )}
    </div>
  );
}

export default memo(TableRemapNode);