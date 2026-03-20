import { useState } from "react";
import { TierItem } from "./TierItem";
import type { Ranking } from "./ItemRankings";

interface TierItemDef {
  readonly id: number;
  readonly name: string;
}

export function TierList() {
  // const editable = false;

  const tlId = 1; // TODO get from route

  const [items] = useState<{
    [key in Ranking | "POOL"]: TierItemDef[];
  }>({
    S: [
      { id: 1, name: "S0" },
      { id: 2, name: "S1" },
      { id: 3, name: "S2" },
      { id: 4, name: "S3" },
      { id: 5, name: "S4" },
      { id: 6, name: "S5" },
      { id: 7, name: "S6" },
      { id: 8, name: "S7" },
      { id: 9, name: "S8" },
      { id: 10, name: "S9" },
    ],
    A: [
      { id: 11, name: "A0" },
      { id: 12, name: "A1" },
      { id: 13, name: "A2" },
    ],
    B: [
      { id: 14, name: "B0" },
      { id: 15, name: "B1" },
    ],
    C: [],
    D: [{ id: 16, name: "chrome" }],
    POOL: [
      { id: 17, name: "POOL0" },
      { id: 18, name: "POOL1" },
      { id: 19, name: "POOL2" },
      { id: 20, name: "POOL3" },
    ],
  });

  return (
    <>
      <div className="grid max-w-3xl grid-cols-[5rem_1fr] gap-0.5 bg-zinc-200">
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="S"
        >
          S
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.S.map((item) => (
            <TierItem key={item.id} tlId={tlId} id={item.id} name={item.name} />
          ))}
        </div>
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="A"
        >
          A
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.A.map((item) => (
            <TierItem key={item.id} tlId={tlId} id={item.id} name={item.name} />
          ))}
        </div>
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="B"
        >
          B
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.B.map((item) => (
            <TierItem key={item.id} tlId={tlId} id={item.id} name={item.name} />
          ))}
        </div>
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="C"
        >
          C
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.C.map((item) => (
            <TierItem key={item.id} tlId={tlId} id={item.id} name={item.name} />
          ))}
        </div>
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="D"
        >
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
