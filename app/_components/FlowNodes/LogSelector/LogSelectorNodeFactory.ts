import { nanoid } from 'nanoid';
import { LogSelectorNodeType, LogSelectorType } from './LogSelectorTypes';
import { BaseLogData } from '@/app/_components/FlowNodes/BaseLog/BaseLogTypes';

export const LogSelectorNodeFactory = (position: { x: number; y: number; }): LogSelectorNodeType => ({
    id: nanoid(),
    type: LogSelectorType,
    position,
    data: new BaseLogData({}),
});
