declare namespace NodeJS {
  interface ProcessEnv {
    readonly ETHERSCAN_API_KEY: string;
    readonly ALCHEMY_URL: string;
    readonly PRIVATE_KEY: string;
  }
}
