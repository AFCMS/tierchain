import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";

import { getTierListItemAsset } from "../data/tierlists";

export interface TierItemProps {
  readonly tlId: number;
  readonly id: number;
  readonly name: string;
  readonly provided: DraggableProvided;
  readonly snapshot: DraggableStateSnapshot;
}

export function TierItem(props: TierItemProps) {
  const image = getTierListItemAsset(props.tlId, props.name);

  return image ? (
    <img
      src={image}
      alt="Tier item"
      className="size-20 rounded object-contain select-none"
      title={props.name}
      loading="lazy"
      fetchPriority="auto"
      ref={(ref) => props.provided.innerRef(ref)}
      draggable={false}
      {...props.provided.draggableProps}
      {...props.provided.dragHandleProps}
    />
  ) : (
    <div
      className="flex size-20 items-center justify-center rounded bg-zinc-300 text-wrap text-ellipsis select-none"
      title={props.name}
      ref={(ref) => props.provided.innerRef(ref)}
      draggable={false}
      {...props.provided.draggableProps}
      {...props.provided.dragHandleProps}
    >
      {props.name}
    </div>
  );
}
