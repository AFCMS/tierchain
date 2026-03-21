import { BrowserRouter, Routes, Route } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { Header } from "./components/Header";
import { config } from "./config/wagmi.config";

import { Home } from "./screens/Home";
import { ListDetail } from "./screens/ListDetail";

const client = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/list/:id" element={<ListDetail />} />
            <Route path="/list/:id/address/:address" element={<ListDetail />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
