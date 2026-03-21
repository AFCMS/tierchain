# TierChain

## Check it out live at https://tierchain.afcms.dev/

Make sure the world knows your outreageous hot takes are yours. Use TierChain. Powered by Etherium (on Sepolia test network).

The owner can define tier lists and items for them.

Users can post and secure their tier lists.

The provided UI allows making and posting a tier list, and can also use provided images in place of the normal names.

## Technology stack

- [Hardhat 3](https://hardhat.org) for smart contract development, local test chain and deployment scripts.
- [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com) and [daisyUI](https://daisyui.com) for the frontend, with [Vite](https://vitejs.dev) as the build tool.
- [Wagmi](https://wagmi.sh) for Ethereum wallet integration in the frontend.
- [Alchemy](https://www.alchemy.com) for Ethereum node access, used in the frontend to interact with the smart contract.
- [Sepolia test network](https://sepolia.etherscan.io) for deploying the smart contract in a live environment without using real Ethereum.

## Running && handy copypastes

Clone the repo :

```bash
https://github.com/AFCMS/tierchain.git
```

Install dependencies :
```bash
pnpm install
```

Build the contract :

```bash
pnpm run build:contract
```
This will create the directory `artifacts/`, which, among other things, contains the abi.

Start hardat :

```bash
pnpm hardhat node
```
Of course, leave this running as long as you are using or developping.
Take an account in there, and set `HARDHAT_PRIVATE_KEY` in your .env to it’s private key, visible in the output.

Deploy the contract (Hardhat node) :

```bash
pnpm hardhat ignition deploy ignition/modules/TierList.ts --network localhost
```
Note you will need to restart hardhat and redeploy the contract every time you change the contract. Hardhat tries to keep the same addresses, but double-check if something goes wrong.
In your .env, set VITE_CONTRACT_TIERLIST_ADDRESS to the outputted address.

Deploy the contract (Sepolia) :

```bash
pnpm hardhat ignition deploy ignition/modules/TierList.ts --network sepolia
```

Populate the tier lists :

```bash
node ./scripts/tierlist-manager.ts create --file ./tierlists/which-browser-is-the-best.json --mode hardhat
```
The script doesn’t yet have a « populate all » option, so for now, use a shell loop.

Run in dev mode :

```bash
pnpm run dev
```

Build and run :

```bash
pnpm run build
```

Run tests :

```bash
pnpm hardhat test
```

## Contract

The contract is located at `contracts/TierList.sol`, along with it’s tests.

For the data it holds, please consult it, a text explaination would not be any clearer, even for the unfamiliar with the self-explanatory solidity syntax.

Events are emitted when a Tier List is created, it’s active status changes, a user submits a new ranking, and when items are added or removed from tier lists.

There is one user function, submitRanking, which, you guessed it, submits a ranking.

Views to be used by frontends are :
- getTierLists(none) : returns all the tier lists currently available
- getTierList(tlId uint256) : returns information about a tier list by it’s id
- getTierListItems(tlId uint256) : returns the items a tier list has for ranking
- getUserVotes(tlId uint256, address user) : returns the ranking of a user for a tier list
- getItemVoteCounts(tlId uint256, itemId uint256) : returns the aggregate of votes for an item of a tier list
- getLatestSubmissions(tlId uint256, limit uint256, offset uint256) : returns a slice of user rankings for a tier list in reverse chronological order. Supports pagination with limit and offset.

Constraints :
- each user can only have one ranking per tier list
- items of a tier list are unique
- rankings are formed correctly, this means : 5 tiers, containing valid items. Items can be left in the pool. For gas economy, we chose to disable enforcing each item be unique within a ranking, but it can be enabled (see line 239 of TierList.sol).



---

<img align="right" src=".github/Hexa_Logo_Sign_RVB_Full.svg" width="300px"/>

**Made with ❤️ by [AFCMS](https://github.com/AFCMS) & [AKArien](https://github.com/AKArien)**

[**Ecole Hexagone**](https://www.ecole-hexagone.com) 🇫🇷 - Class of 2025/2026
