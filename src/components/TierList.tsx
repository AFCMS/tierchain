import { useMemo, useState } from "react";
import { DragDropContext, type DraggableLocation } from "@hello-pangea/dnd";

import type { Ranking } from "./ItemRankings";
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

const TIER_NAMES: Array<Ranking | "POOL"> = ["S", "A", "B", "C", "D", "POOL"];

function cloneBuckets(items: TierListBuckets): TierListBuckets {
  return {
    S: [...items.S],
    A: [...items.A],
    B: [...items.B],
    C: [...items.C],
    D: [...items.D],
    POOL: [...items.POOL],
  };
}

function areBucketsEqual(
  left: TierListBuckets,
  right: TierListBuckets,
): boolean {
  return TIER_NAMES.every((tierName) => {
    const leftTier = left[tierName];
    const rightTier = right[tierName];

    if (leftTier.length !== rightTier.length) {
      return false;
    }

    return leftTier.every(
      (item, index) =>
        item.id === rightTier[index]?.id &&
        item.name === rightTier[index]?.name,
    );
  });
}

function isTierName(value: string): value is Ranking | "POOL" {
  return TIER_NAMES.includes(value as Ranking | "POOL");
}

export function TierList(props: TierListProps) {
  const { tlId, items } = props;
  const [originalItems] = useState<TierListBuckets>(() => cloneBuckets(items));
  const [updatedItems, setUpdatedItems] = useState<TierListBuckets>(() =>
    cloneBuckets(items),
  );

  const hasPendingChanges = useMemo(
    () => !areBucketsEqual(originalItems, updatedItems),
    [originalItems, updatedItems],
  );

  function reorderTierList(
    source: DraggableLocation<string>,
    destination: DraggableLocation<string>,
  ) {
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceTierName = source.droppableId;
    const destinationTierName = destination.droppableId;

    if (!isTierName(sourceTierName) || !isTierName(destinationTierName)) {
      return;
    }

    setUpdatedItems((currentItems) => {
      const nextItems = cloneBuckets(currentItems);
      const sourceTier = [...nextItems[sourceTierName]];
      const [movedItem] = sourceTier.splice(source.index, 1);

      if (!movedItem) {
        return currentItems;
      }

      if (sourceTierName === destinationTierName) {
        sourceTier.splice(destination.index, 0, movedItem);
        nextItems[sourceTierName] = sourceTier;
        return nextItems;
      }

      const destinationTier = [...nextItems[destinationTierName]];
      destinationTier.splice(destination.index, 0, movedItem);
      nextItems[sourceTierName] = sourceTier;
      nextItems[destinationTierName] = destinationTier;

      return nextItems;
    });
  }

  function handleUpdateUserData() {
    console.log("Update user tier list data", updatedItems);
  }

  return (
    <div className="w-full select-none" draggable={false}>
      <DragDropContext
        onDragEnd={(result) => {
          // dropped outside the list
          if (!result.destination) {
            return;
          }

          reorderTierList(result.source, result.destination);
        }}
      >
        <div className="bg-base-100 mb-0.5 grid max-w-3xl grid-cols-[5rem_1fr] gap-0.5 select-none">
          <div
            className="flex size-20 items-center justify-center text-black"
            data-rank-bg="S"
          >
            S
          </div>
          <TierListTier tlId={tlId} tierName="S" items={updatedItems.S} />

          <div
            className="flex size-20 items-center justify-center text-black"
            data-rank-bg="A"
          >
            A
          </div>
          <TierListTier tlId={tlId} tierName="A" items={updatedItems.A} />

          <div
            className="flex size-20 items-center justify-center text-black"
            data-rank-bg="B"
          >
            B
          </div>
          <TierListTier tlId={tlId} tierName="B" items={updatedItems.B} />

          <div
            className="flex size-20 items-center justify-center text-black"
            data-rank-bg="C"
          >
            C
          </div>
          <TierListTier tlId={tlId} tierName="C" items={updatedItems.C} />

          <div
            className="flex size-20 items-center justify-center text-black"
            data-rank-bg="D"
          >
            D
          </div>
          <TierListTier tlId={tlId} tierName="D" items={updatedItems.D} />
        </div>

        <TierListTier tlId={tlId} tierName="POOL" items={updatedItems.POOL} />

        {hasPendingChanges ? (
          <div className="my-4 flex w-full justify-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpdateUserData}
            >
              Update user data
            </button>
          </div>
        ) : undefined}
      </DragDropContext>
    </div>
  );
}
