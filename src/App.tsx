import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { Header } from "./components/Header";
import { config } from "./config/wagmi.config";

const client = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <Header />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
