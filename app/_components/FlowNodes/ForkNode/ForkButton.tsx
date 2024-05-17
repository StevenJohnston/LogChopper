export interface ForkButtonProps {
  onClick: () => Promise<void>;
  children: React.ReactNode
}
const ForkButton = ({ onClick, children }: ForkButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="bg-red-400 rounded text-white p-2 m-[1px] hover:bg-red-300"
    >
      {children}
    </button>
  )
}

export default ForkButton