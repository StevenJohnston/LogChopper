import { Table3D } from '@/src/_lib/rom-metadata';
import dynamic from 'next/dynamic';

interface SurfaceProps {
  table: Table3D<number | string>
}

const DynamicChatWidget = dynamic(
  () => import('@/src/_components/Surface').then(mod => mod.default),
  { ssr: false }
);

export default function SurfaceSSG({ table }: SurfaceProps) {
  return <DynamicChatWidget table={table} />
}