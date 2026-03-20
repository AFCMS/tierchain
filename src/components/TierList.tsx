import { TierItem } from "./TierItem";
import type { Ranking } from "./ItemRankings";

export interface TierItemDef {
  readonly id: number;
  readonly name: string;
}

export type TierListBuckets = Record<Ranking | "POOL", TierItemDef[]>;

export interface TierListProps {
  readonly tlId: number;
  readonly items: TierListBuckets;
}

export function TierList(props: TierListProps) {
  const { tlId, items } = props;

  return (
    <>
      <div className="grid max-w-3xl grid-cols-[5rem_1fr] gap-0.5 bg-zinc-200">
        <div className="flex size-20 items-center justify-center" data-rank-bg="S">
          S
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.S.map((item) => (
            <TierItem key={item.id} tlId={tlId} id={item.id} name={item.name} />
          ))}
        </div>

        <div className="flex size-20 items-center justify-center" data-rank-bg="A">
          A
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.A.map((item) => (
            <TierItem key={item.id} tlId={tlId} id={item.id} name={item.name} />
          ))}
        </div>

        <div className="flex size-20 items-center justify-center" data-rank-bg="B">
          B
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.B.map((item) => (
            <TierItem key={item.id} tlId={tlId} id={item.id} name={item.name} />
          ))}
        </div>

        <div className="flex size-20 items-center justify-center" data-rank-bg="C">
          C
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.C.map((item) => (
            <TierItem key={item.id} tlId={tlId} id={item.id} name={item.name} />
          ))}
        </div>

        <div className="flex size-20 items-center justify-center" data-rank-bg="D">
          D
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.D.map((item) => (
            <TierItem key={item.id} tlId={tlId} id={item.id} name={item.name} />
          ))}
        </div>
      </div>

      <div className="mt-4 flex w-full flex-wrap gap-0.5">
        {items.POOL.map((item) => (
          <TierItem key={item.id} tlId={tlId} id={item.id} name={item.name} />
        ))}
      </div>
    </>
  );
}