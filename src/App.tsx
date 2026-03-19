import { BrowserRouter } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { Header } from "./components/Header";
import { config } from "./config/wagmi.config";

import { TierList } from "./components/TierList";
import { ItemRankings } from "./components/ItemRankings";

import { Home } from "./screens/Home";

const client = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <Header />
        <TierList />
        <div className="card">
          <h1 className="card-title">Scores</h1>
          <ItemRankings
            data={{
              S: 21,
              A: 10,
              B: 2,
              C: 5,
              D: 14,
            }}
          />
        </div>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
