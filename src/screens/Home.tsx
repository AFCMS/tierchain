import { AllLists } from "../components/AllLists";

export function Home() {
  return (
    <div className="flex w-full justify-center p-4">
      <div className="container">
        <h1 className="mb-4 text-xl font-bold">All Tier Lists</h1>
        <AllLists />
      </div>
    </div>
  );
}
