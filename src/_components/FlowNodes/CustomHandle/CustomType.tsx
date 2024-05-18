'use client'
import { Position, HandleProps } from 'reactflow';

export interface CustomHandleProps extends HandleProps {
  dataType: "Log" | "1D" | "2D" | "3D"
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
