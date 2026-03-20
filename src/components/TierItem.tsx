import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";

import { TierItemSimple } from "./TierItemSimple";

export interface TierItemProps {
  readonly tlId: number;
  readonly id: number;
  readonly name: string;
  readonly provided: DraggableProvided;
  readonly snapshot: DraggableStateSnapshot;
  readonly onClick?: React.MouseEventHandler<HTMLImageElement>;
}

export function TierItem(props: TierItemProps) {
  return (
    <TierItemSimple
      tlId={props.tlId}
      id={props.id}
      name={props.name}
      additionalProps={{
        onClick: props.onClick,
        ref: (ref: HTMLElement) => props.provided.innerRef(ref),
        ...props.provided.draggableProps,
        ...props.provided.dragHandleProps,
      }}
    />
  );
}
