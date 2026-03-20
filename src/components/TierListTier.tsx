import { Draggable, Droppable } from "@hello-pangea/dnd";
import { TierItem } from "./TierItem";

export interface TierListTierProps {
  readonly tlId: number;
  readonly tierName: string;
  readonly items: {
    readonly id: number;
    readonly name: string;
  }[];
}

export function TierListTier(props: TierListTierProps) {
  return (
    <Droppable
      droppableId={props.tierName}
      type="tier_item"
      direction="horizontal"
      isCombineEnabled={false}
    >
      {(dropProvided) => (
        <div {...dropProvided.droppableProps} className="h-full w-full">
          <div
            ref={dropProvided.innerRef}
            className="flex h-full w-full flex-wrap gap-0.5"
          >
            {props.items.map((item, index) => (
              <Draggable
                key={item.id}
                draggableId={item.id.toString()}
                index={index}
              >
                {(dragProvided, dragSnapshot) => (
                  <TierItem
                    key={item.id}
                    tlId={props.tlId}
                    name={item.name}
                    id={item.id}
                    provided={dragProvided}
                    snapshot={dragSnapshot}
                  />
                )}
              </Draggable>
            ))}
            {dropProvided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}
