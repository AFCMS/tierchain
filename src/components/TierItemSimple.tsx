import { getTierListItemAsset } from "../data/tierlists";

export interface TierItemSimpleProps {
  readonly tlId: number;
  readonly id: number;
  readonly name: string;
  readonly additionalProps?: Record<string, unknown>;
}

export function TierItemSimple(props: TierItemSimpleProps) {
  const image = getTierListItemAsset(props.tlId, props.name);

  return image ? (
    <img
      src={image}
      alt={props.name}
      className="size-20 rounded object-contain select-none"
      title={props.name}
      loading="lazy"
      fetchPriority="auto"
      draggable={false}
      {...props.additionalProps}
    />
  ) : (
    <div
      className="bg-base-100 flex size-20 items-center justify-center rounded text-wrap text-ellipsis select-none"
      title={props.name}
      draggable={false}
      {...props.additionalProps}
    >
      {props.name}
    </div>
  );
}
