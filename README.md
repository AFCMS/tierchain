# TierChain

Make sure the world knows your outreageous hot takes are yours. Use TierChain. Powered by Etherium (on Sepolia test network).

The owner can define tier lists and items for them.

Users can post and secure their tier lists.

The provided UI allows making and posting a tier list, and can also use provided images in place of the normal names.

## Technology stack

- [Hardhat 3](https://hardhat.org) for smart contract development, local test chain and deployment scripts.
- [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com) and [daisyUI](https://daisyui.com) for the frontend, with [Vite](https://vitejs.dev) as the build tool.
- [Wagmi](https://wagmi.sh) for Ethereum wallet integration in the frontend.
- [Sepolia test network](https://sepolia.etherscan.io) for deploying the smart contract in a live environment without using real Ethereum.

## Running && handy copypastes

Clone the repo :

```bash
https://github.com/AFCMS/tierchain.git
```

Build the contract :

```bash
pnpm run build:contract
```
