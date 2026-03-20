import type { Ranking } from "./ItemRankings";
import { DragDropContext, type DraggableLocation } from "@hello-pangea/dnd";
import { TierListTier } from "./TierListTier";

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

  function reorderTierList(
    source: DraggableLocation<string>,
    destination: DraggableLocation<string>,
  ) {
    console.log("Reorder item from", source, "to", destination);
  }

  return (
    <DragDropContext
      onDragEnd={(result) => {
        // dropped outside the list
        if (!result.destination) {
          return;
        }

        reorderTierList(result.source, result.destination);
      }}
    >
      <div className="grid max-w-3xl grid-cols-[5rem_1fr] gap-0.5 bg-zinc-200">
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="S"
        >
          S
        </div>
        <div className="flex flex-wrap gap-0.5">
          <TierListTier tlId={tlId} tierName="S" items={items.S} />
        </div>

        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="A"
        >
          A
        </div>
        <div className="flex flex-wrap gap-0.5">
          <TierListTier tlId={tlId} tierName="A" items={items.A} />
        </div>

        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="B"
        >
          B
        </div>
        <div className="flex flex-wrap gap-0.5">
          <TierListTier tlId={tlId} tierName="B" items={items.B} />
        </div>

        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="C"
        >
          C
        </div>
        <div className="flex flex-wrap gap-0.5">
          <TierListTier tlId={tlId} tierName="C" items={items.C} />
        </div>

        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="D"
        >
          D
        </div>
        <div className="flex flex-wrap gap-0.5">
          <TierListTier tlId={tlId} tierName="D" items={items.D} />
        </div>
      </div>

      <div className="mt-4 flex w-full flex-wrap gap-0.5">
        <TierListTier tlId={tlId} tierName="POOL" items={items.POOL} />
      </div>
    </DragDropContext>
  );
}
