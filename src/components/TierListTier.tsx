import { Draggable, Droppable } from "@hello-pangea/dnd";
import { TierItem } from "./TierItem";

export interface TierListTierProps {
  readonly tlId: number;
  readonly tierName: string;
  readonly items: {
    readonly id: number;
    readonly name: string;
  }[];
  readonly editable?: boolean;
  readonly setGlobalVotesItem?: (
    id: number | null,
    name: string | null,
  ) => void;
}

export function TierListTier(props: TierListTierProps) {
  const { editable = true, setGlobalVotesItem: setGlobalVotesItemId } = props;
  return (
    <Droppable
      droppableId={props.tierName}
      type="tier_item"
      direction="horizontal"
      isCombineEnabled={false}
      isDropDisabled={!editable}
    >
      {(dropProvided) => (
        <div
          {...dropProvided.droppableProps}
          className="bg-base-300 h-full w-full select-none"
        >
          <div
            ref={dropProvided.innerRef}
            className="flex h-full min-h-20 w-full flex-wrap"
          >
            {props.items.map((item, index) => (
              <Draggable
                key={item.id}
                draggableId={item.id.toString()}
                index={index}
                isDragDisabled={!editable}
              >
                {(dragProvided, dragSnapshot) => (
                  <TierItem
                    key={item.id}
                    tlId={props.tlId}
                    name={item.name}
                    id={item.id}
                    provided={dragProvided}
                    snapshot={dragSnapshot}
                    onClick={
                      setGlobalVotesItemId
                        ? () => setGlobalVotesItemId(item.id, item.name)
                        : undefined
                    }
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
