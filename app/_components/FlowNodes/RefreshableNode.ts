import { MyWorker } from "@/app/_lib/worker-utilts";
import { MyNode } from "@/app/store/useFlow";
import { Edge } from "reactflow";

export interface RefreshSource {
  sourceNodeId: string;
  refreshUUID: string;
}

export interface KillablePromise<T> {
  worker: MyWorker;
  promise: Promise<T>;
}

export interface Cloneable<T> {
  clone(updates?: Partial<T>): T;
}

export abstract class RefreshableNode<T> implements Cloneable<T> {
  loading?: boolean;
  updates?: RefreshSource[];
  activeUpdate?: KillablePromise<Partial<T>> | null;
  abstract clone(updates?: Partial<T>): T;
  abstract createWorker(): Worker;
  public abstract addWorkerPromise(
    node: MyNode,
    nodes: MyNode[],
    edges: Edge[]
  ): void;
  public isPartial(nodeData: unknown): nodeData is Partial<T> {
    return (
      nodeData !== null &&
      typeof nodeData === "object" &&
      Object.keys(nodeData).every((key) => key in this)
    );
  }
}
