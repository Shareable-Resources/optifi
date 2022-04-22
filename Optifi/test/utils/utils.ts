import { Asset } from "../optifi-exchange-types";
import { PublicKey } from "@solana/web3.js";
import Config from "../config.json";

export const getOracleFeed = (asset: Asset, is_spot: boolean): PublicKey => {
  switch (asset) {
    case Asset.Bitcoin:
      return new PublicKey(
        is_spot ? Config.oracles.oracleBtcSpot : Config.oracles.oracleBtcIv
      );
    case Asset.Ethereum:
      return new PublicKey(
        is_spot ? Config.oracles.oracleEthSpot : Config.oracles.oracleEthIv
      );
    case Asset.USDC:
      return new PublicKey(is_spot ? Config.oracles.oracleUsdcSpot : "");
  }
};
