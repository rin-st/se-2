import { useMemo } from "react";
import type { Abi } from "abitype";

import { useDeployedContractInfo, useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { BigNumber } from "ethers";
import { useAnimationConfig } from "~~/hooks/scaffold-eth/useAnimationConfig";
import { useAccount, useContractReads } from "wagmi";
import { getTargetNetwork } from "~~/utils/scaffold-eth";

export default function ContractData() {
  const { address } = useAccount();

  const { data: balanceOf } = useScaffoldContractRead<BigNumber>("AchievementsNFT", "balanceOf", [address]);

  const { data: deployedContractData } = useDeployedContractInfo("AchievementsNFT");

  const configuredChain = getTargetNetwork();

  const tokensOfOwnerByIndexReadsData = useMemo(() => {
    return {
      contracts: new Array(Number(balanceOf) || 0).fill("").map((_, idx) => ({
        chainId: configuredChain.id,
        functionName: "tokenOfOwnerByIndex",
        address: deployedContractData?.address,
        abi: deployedContractData?.abi as Abi,
        args: [address, idx],
      })),
    };
  }, [address, balanceOf, configuredChain.id, deployedContractData?.abi, deployedContractData?.address]);

  const { data: tokensOfOwnerByIndexResult } = useContractReads(tokensOfOwnerByIndexReadsData);

  const tokenStringsReadsData = useMemo(() => {
    return {
      contracts: (tokensOfOwnerByIndexResult || []).map(tokenId => ({
        chainId: configuredChain.id,
        functionName: "getRawAchievement",
        address: deployedContractData?.address,
        abi: deployedContractData?.abi as Abi,
        args: [String(tokenId)],
      })),
    };
  }, [configuredChain.id, deployedContractData?.abi, deployedContractData?.address, tokensOfOwnerByIndexResult]);

  const { data: tokenUrisData } = useContractReads(tokenStringsReadsData);

  const { showAnimation } = useAnimationConfig(balanceOf);

  return (
    <div className="flex flex-col justify-center items-center bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] py-10 px-5 sm:px-0 lg:py-auto max-w-[100vw] ">
      <div
        className={`flex flex-col max-w-md bg-base-200 bg-opacity-70 rounded-2xl shadow-lg px-5 py-4 w-full ${
          showAnimation ? "animate-zoom" : ""
        }`}
      >
        {balanceOf?.toString()}
        <br />
        {(tokenUrisData as string[])?.map(el => {
          const dividerIndex = el.lastIndexOf(",");

          return (
            <div className="flex justify-between" key={el}>
              <span>{el.slice(0, dividerIndex)}</span>
              <span>{el.slice(dividerIndex + 1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
