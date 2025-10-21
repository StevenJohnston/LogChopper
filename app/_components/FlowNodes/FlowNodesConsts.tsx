'use client'
import { BaseLogData, BaseLogType } from "@/app/_components/FlowNodes/BaseLog/BaseLogTypes";
import { FillTableData, FillTableType } from '@/app/_components/FlowNodes/FillTable/FillTableTypes';
import { BaseTableData, BaseTableType } from '@/app/_components/FlowNodes/BaseTable/BaseTableTypes';
import { LogFilterData, LogFilterType } from '@/app/_components/FlowNodes/LogFilter/LogFilterTypes';
import { FillLogTableData, FillLogTableType } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableTypes';
import { GroupData, GroupType } from '@/app/_components/FlowNodes/Group/GroupNodeTypes';
import { CombineAdvancedTableData, CombineAdvancedTableType } from '@/app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableTypes';
import { CombineData, CombineType } from '@/app/_components/FlowNodes/Combine/CombineTypes';
import { LogAlterData, LogAlterType } from '@/app/_components/FlowNodes/LogAlter/LogAlterTypes';
import { RunningLogAlterData, RunningLogAlterType } from '@/app/_components/FlowNodes/RunningLogAlter/RunningLogAlterTypes';
import { BaseRomData, BaseRomType } from '@/app/_components/FlowNodes/BaseRom/BaseRomTypes';
import { AfrShiftData, AfrShiftType } from "@/app/_components/FlowNodes/AfrShift/AfrShiftTypes";
import { MovingAverageLogFilterData, MovingAverageLogFilterType } from "@/app/_components/FlowNodes/MovingAverageLogFilter/MovingAverageLogFilterTypes";
import { AfrMlShifterData, AfrMlShifterType } from "@/app/_components/FlowNodes/AfrMlShifter/AfrMlShifterTypes";
import { TpsAfrDeleteData, TpsAfrDeleteType } from "@/app/_components/FlowNodes/TpsAfrDelete/TpsAfrDeleteTypes";
import { LogSelectorType } from "@/app/_components/FlowNodes/LogSelector/LogSelectorTypes";
import { RomSelectorType } from "./RomSelector/RomSelectorTypes";

export const LogNodeTypes: string[] = [BaseLogType, LogFilterType, LogAlterType, RunningLogAlterType, MovingAverageLogFilterType, TpsAfrDeleteType, LogSelectorType]
export const TableNodeTypes: string[] = [FillTableType, BaseTableType, FillLogTableType, CombineAdvancedTableType, CombineType]


export const NodeFactoryLookup = {
    [BaseRomType]: BaseRomData,
    [BaseLogType]: BaseLogData,
    [BaseTableType]: BaseTableData,
    [FillLogTableType]: FillLogTableData,
    [FillTableType]: FillTableData,
    [GroupType]: GroupData,
    [LogFilterType]: LogFilterData,
    [LogAlterType]: LogAlterData,
    [CombineAdvancedTableType]: CombineAdvancedTableData,
    [CombineType]: CombineData,
    [RunningLogAlterType]: RunningLogAlterData,
    [AfrShiftType]: AfrShiftData,
    [MovingAverageLogFilterType]: MovingAverageLogFilterData,
    [AfrMlShifterType]: AfrMlShifterData,
    [TpsAfrDeleteType]: TpsAfrDeleteData,
    [LogSelectorType]: BaseLogData,
    [RomSelectorType]: BaseRomData
} as const
