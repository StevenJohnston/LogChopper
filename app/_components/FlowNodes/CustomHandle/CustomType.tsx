'use client'
import { Position, HandleProps } from 'reactflow';
import { Table } from '@/app/_lib/rom-metadata';

export type HandleTypes = Table<void>['type'] | "Log" | "Rom"

export interface CustomHandleProps extends HandleProps {
  dataType: HandleTypes
  label?: string
  top?: string
  right?: string
}

export const positionTranslation = {
  [Position.Right]: {
    right: "unset",
    left: "calc(100% - 5px)"
  },
  [Position.Bottom]: {
    bottom: "unset",
    top: "calc(100% - 5px)"
  },
  [Position.Left]: {
    left: "unset",
    right: "calc(100% - 5px)"
  },
  [Position.Top]: {
    top: "unset",
    bottom: "calc(100% - 5px)"
  },
}
