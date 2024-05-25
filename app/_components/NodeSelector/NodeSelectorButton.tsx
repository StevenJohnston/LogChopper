import { MouseEventHandler, ReactNode } from "react";

interface NodeSelectorButtonProps {
  onClick: MouseEventHandler<HTMLElement>;
  children: ReactNode;
  deleteMode?: boolean;
}
const NodeSelectorButton = ({ onClick, children, deleteMode }: NodeSelectorButtonProps) => {
  return (
    <button
      className={`flex flex-col justify-center items-center bg-white ${deleteMode ? 'hover:bg-red-500' : 'hover:bg-blue-500'} ${deleteMode ? 'text-red-700' : 'text-blue-700'} border ${deleteMode ? 'border-red-500' : 'border-blue-500'} hover:text-white hover:border-transparent rounded-md h-20 w-[calc(50%-2px)] m-[1px] box-border`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
export default NodeSelectorButton