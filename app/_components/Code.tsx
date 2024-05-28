

interface CodeProps {
  children: React.ReactNode
}

const Code = ({ children }: CodeProps) => {
  return (
    <span className="inline-block text-black bg-gray-200 p-1 rounded-lg mb-1 font-mono">
      {children}
    </span>
  )
}

export default Code