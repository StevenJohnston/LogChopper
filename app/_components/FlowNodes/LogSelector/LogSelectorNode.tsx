'use client';

import { NodeProps, Position } from "reactflow";
import { LogSelectorNodeType } from "./LogSelectorTypes";
import useFlow, { RFState } from "@/app/store/useFlow";
import { CustomHandle } from "../CustomHandle/CustomHandle";
import useRom from "@/app/store/useRom";
import { shallow } from "zustand/shallow";
import { useEffect, useState } from "react";
import { Combobox } from "@headlessui/react";
import { BaseLogData } from "@/app/_components/FlowNodes/BaseLog/BaseLogTypes";
import { useRomSelector } from "@/app/store/useRom";

const selector = (state: RFState) => ({
    nodes: state.nodes,
    updateNode: state.updateNode,
});

const LogSelectorNode = ({ id, data }: NodeProps<BaseLogData>) => {
    const { logFiles } = useRom(useRomSelector, shallow);
    const { nodes, updateNode } = useFlow(selector, shallow);

    const [query, setQuery] = useState('');
    const [sortedLogFiles, setSortedLogFiles] = useState<FileSystemFileHandle[]>([]);

    useEffect(() => {
        const sortFiles = async () => {
            const filesWithDates = await Promise.all(
                logFiles.map(async (handle) => {
                    const file = await handle.getFile();
                    return { handle, lastModified: file.lastModified };
                })
            );

            filesWithDates.sort((a, b) => b.lastModified - a.lastModified);

            setSortedLogFiles(filesWithDates.map(item => item.handle));
        };

        sortFiles();
    }, [logFiles]);

    useEffect(() => {
        if (sortedLogFiles.length > 0 && data.selectedLogFileNames && data.selectedLogFileNames.length > 0 && data.selectedLogFiles.length === 0) {
            const selected = sortedLogFiles.filter(handle =>
                data.selectedLogFileNames?.some(selectedFileName => selectedFileName === handle.name)
            );
            if (selected.length > 0) {
                (async () => {
                    const selectedLogFiles = await Promise.all(selected.map(fh => fh.getFile()));
                    const node = nodes.find(n => n.id === id) as LogSelectorNodeType;
                    if (!node) return;
                    updateNode({ ...node, data: data.clone({ selectedLogFiles }) });
                })();
            }
        }
    }, [sortedLogFiles, data.selectedLogFileNames, data, id, nodes, updateNode]);

    const selectedLogFileHandles = sortedLogFiles.filter(handle => 
        data.selectedLogFileNames?.some(selectedFileName => selectedFileName === handle.name)
    ) ?? [];

    const filteredLogs = sortedLogFiles
        .filter(file => file.name.endsWith('.csv'))
        .filter(file => file.name.toLowerCase().includes(query.toLowerCase()));

    const handleLogSelect = (fileHandles: FileSystemFileHandle[]) => {
        (async () => {
            const node = nodes.find(n => n.id === id) as LogSelectorNodeType;
            if (!node) return;

            const selectedLogFiles = await Promise.all(fileHandles.map(fh => fh.getFile()));
            const selectedLogFileNames = fileHandles.map(fh => fh.name);
            const logData = new BaseLogData({ selectedLogFiles, selectedLogFileNames });

            updateNode({ ...node, data: logData });
        })()
    };

    return (
        <div className="nowheel node log-selector-node bg-sky-300 p-2 rounded-md w-64">
            <div className="node-header">
                <p className="text-black">Log Selector</p>
            </div>
            <div className="relative mt-2">
                <Combobox onChange={handleLogSelect} value={selectedLogFileHandles} multiple>
                    <Combobox.Input
                        className="w-full rounded-md border-0 bg-sky-400 py-1.5 pl-3 pr-10 text-black focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                        onChange={(event) => setQuery(event.target.value)}
                        displayValue={(files: FileSystemFileHandle[]) => files.length > 0 ? `${files.length} logs selected` : ''}
                        placeholder="Select logs..."/>
                                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                                            </Combobox.Button>
                    
                                            {filteredLogs.length > 0 && (
                                                <Combobox.Options
                                                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-sky-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                    {filteredLogs.map((file) => (
                                                        <Combobox.Option
                                                            key={file.name}
                                                            value={file}
                                                            className={({ active }) =>
                                                                `relative cursor-default select-none py-2 pl-10 pr-4 text-white ${active ? 'bg-sky-600' : ''}`
                                                            }
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className={`block break-words ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                        {file.name}
                                                                    </span>
                                                                    {selected ? (
                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                        </span>
                                                                    ) : null}
                                                                </>
                                                            )}
                                                        </Combobox.Option>
                                                    ))}
                                                </Combobox.Options>
                                            )}
                                        </Combobox>
                                    </div>
                                    <CustomHandle type="source" position={Position.Right} id="log" dataType={'Log'} />
                                </div>    );
};

export default LogSelectorNode;
