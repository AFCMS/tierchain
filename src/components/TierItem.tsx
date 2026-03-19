export function TierItem() {
  const image = undefined;
  const name = "AAA";

  return image ? (
    <img src={image} alt="Tier item" className="size-20 rounded object-cover" />
  ) : (
    <div className="flex size-20 items-center justify-center rounded bg-zinc-300">
      {name}
    </div>
  );
}
