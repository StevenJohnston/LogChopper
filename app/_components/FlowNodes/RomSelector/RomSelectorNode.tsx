'use client';

import { NodeProps, Position } from "reactflow";
import { RomSelectorNodeType } from "./RomSelectorTypes";
import useFlow, { RFState } from "@/app/store/useFlow";
import { CustomHandle } from "../CustomHandle/CustomHandle";
import { useRomSelector } from "@/app/store/useRom";
import useRom from "@/app/store/useRom";
import { shallow } from "zustand/shallow";
import { useEffect, useState } from "react";
import { Combobox } from "@headlessui/react";
import { BaseRomData } from "@/app/_components/FlowNodes/BaseRom/BaseRomTypes";

const selector = (state: RFState) => ({
    nodes: state.nodes,
    updateNode: state.updateNode,
});

const RomSelectorNode = ({ id, data }: NodeProps<BaseRomData>) => {
    const { romFiles, scalingMap, tableMap } = useRom(useRomSelector, shallow);
    const { nodes, updateNode } = useFlow(selector, shallow);

    const [query, setQuery] = useState('');
    const [sortedRomFiles, setSortedRomFiles] = useState<FileSystemFileHandle[]>([]);

    useEffect(() => {
        const sortFiles = async () => {
            const filesWithDates = await Promise.all(
                romFiles.map(async (handle) => {
                    const file = await handle.getFile();
                    return { handle, lastModified: file.lastModified };
                })
            );

            filesWithDates.sort((a, b) => b.lastModified - a.lastModified);

            setSortedRomFiles(filesWithDates.map(item => item.handle));
        };

        sortFiles();
    }, [romFiles]);

    const selectedRomFileHandle = sortedRomFiles.find(handle => handle.name === data.selectedRomFile?.name) ?? null;

    const filteredRoms = sortedRomFiles
        .filter(file => file.name.endsWith('.bin') || file.name.endsWith('.srf'))
        .filter(file => file.name.toLowerCase().includes(query.toLowerCase()));

    const handleRomSelect = async (fileHandle: FileSystemFileHandle | null) => {
        if (!fileHandle) return;

        const node = nodes.find(n => n.id === id) as RomSelectorNodeType;
        if (!node) return;

        const selectedRomFile = await fileHandle.getFile();
        const romData = new BaseRomData({ selectedRomFile, scalingMap, tableMap });

        updateNode({ ...node, data: romData });
    };

    return (
        <div className="nowheel node rom-selector-node bg-lime-300 p-2 rounded-md w-64">
            <div className="node-header">
                <p className="text-black">ROM Selector</p>
            </div>
            <div className="relative mt-2">
                <Combobox onChange={handleRomSelect} value={selectedRomFileHandle}>
                    <Combobox.Input
                        className="w-full rounded-md border-0 bg-lime-400 py-1.5 pl-3 pr-10 text-black focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                        onChange={(event) => setQuery(event.target.value)}
                        displayValue={(file: FileSystemFileHandle) => file?.name || ''}
                        placeholder="Select a ROM..."
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                    </Combobox.Button>

                    {filteredRoms.length > 0 && (
                        <Combobox.Options
                            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-lime-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredRoms.map((file) => (
                                <Combobox.Option
                                    key={file.name}
                                    value={file}
                                    className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-3 pr-9 text-white ${active ? 'bg-lime-600' : ''}`
                                    }
                                >
                                    {({ selected }) => (
                                        <span className={`block ${selected ? 'font-semibold' : ''}`}>
                                            {file.name}
                                        </span>
                                    )}
                                </Combobox.Option>
                            ))}
                        </Combobox.Options>
                    )}
                </Combobox>
            </div>
            <CustomHandle type="source" position={Position.Right} id="rom" dataType={'Rom'} />
        </div>
    );
};

export default RomSelectorNode;
