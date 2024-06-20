import { Scaling } from "@/app/_lib/rom-metadata"
import { ChangeEvent, useCallback, MouseEvent } from "react"

interface ScalingSelectorProps {
  scalingMap?: Record<string, Scaling> | null
  scalingValue?: Scaling | null
  setScalingValue?: (scalingValue: Scaling | undefined | null) => void
}

const ScalingSelector = ({
  scalingMap,
  scalingValue,
  setScalingValue
}: ScalingSelectorProps) => {
  const onScalingSelect = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const scalingKey = event.target.value as keyof typeof scalingMap
    if (scalingKey == undefined || !scalingMap) {
      setScalingValue?.(undefined)
      return
    }
    if (scalingKey in scalingMap) {
      setScalingValue?.(scalingMap[scalingKey])
    } else {
      setScalingValue?.(null)
    }

  }, [scalingMap, setScalingValue])

  const stopPropagation = useCallback((event: MouseEvent<HTMLSelectElement>) => {
    event.stopPropagation()
  }, [])

  if (!scalingMap) return
  return (
    <select
      onClick={stopPropagation}
      id="aggregator"
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      onChange={onScalingSelect}
      value={scalingValue?.name || ""}
    >
      <option value={"DEFAULT_SCALING"}>Adaptive Scaling</option>
      {
        Object.keys(scalingMap).map((f) => {
          return (
            <option key={f} value={f}>{f}</option>
          )
        })
      }
    </select>
  )
}
export default ScalingSelector