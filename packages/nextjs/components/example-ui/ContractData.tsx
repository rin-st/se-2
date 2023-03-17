import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Abi } from "abitype";
import { BigNumber } from "ethers";
import { useAccount, useContractReads } from "wagmi";
import { useDeployedContractInfo, useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { useAnimationConfig } from "~~/hooks/scaffold-eth/useAnimationConfig";
import { getTargetNetwork } from "~~/utils/scaffold-eth";

type NftTokenData = {
  name: string;
  description: string;
  image: string;
};

export const ContractData = () => {
  const { address } = useAccount();

  const { data: balanceOf } = useScaffoldContractRead<BigNumber>("AchievementsNFT", "balanceOf", [address]);

  const { data: deployedContractData } = useDeployedContractInfo("AchievementsNFT");

  const [nftData, setNftData] = useState<NftTokenData[] | null>(null);
  const [nftMode, setNftMode] = useState(false);

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

  useEffect(() => {
    const fetcher = async () => {
      if (!!tokensOfOwnerByIndexResult?.length) {
        const res = await fetch(`/api/token-uris/${tokensOfOwnerByIndexResult?.join(",")}`);
        const data = await res.json();
        setNftData(data);
      }
    };
    fetcher();
  }, [tokensOfOwnerByIndexResult]);

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

  const tokensData = tokenUrisData?.reverse() as [string, string][];
  const totalAchievementPoints = tokensData?.filter(t => t).reduce((acc, val) => acc + Number(val[1]), 0) || 0;

  const { showAnimation } = useAnimationConfig(balanceOf);

  return (
    <div className="flex flex-col items-center bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] py-10 px-5 sm:px-0 lg:py-auto max-w-[100vw] ">
      <div className={`flex flex-col max-w-md bg-base-200 bg-opacity-70 rounded-2xl shadow-lg px-5 py-4 w-full`}>
        <div className="flex justify-between" key="total-achievements">
          <span>Total achievements:</span>
          <span className={`${showAnimation ? "animate-zoom" : ""}`}>{balanceOf?.toString() || 0}</span>
        </div>

        <div className="flex justify-between" key="total-points">
          <span>Total points:</span>
          <span className={`${showAnimation ? "animate-zoom" : ""}`}>{totalAchievementPoints}</span>
        </div>
      </div>
      <div className={`flex space-x-2 my-4 max-w-md w-full`}>
        <span>Show nfts:</span>
        <input
          id="theme-toggle"
          type="checkbox"
          className="toggle toggle-secondary bg-secondary"
          onChange={() => setNftMode(!nftMode)}
          checked={nftMode}
        />
      </div>
      <div className="flex flex-col gap-2 max-w-md w-full">
        {nftMode
          ? nftData?.map(r => <Image key={r.image} src={r.image} alt="img" width={200} height={250} />)
          : tokensData?.map(([name, points]) => (
              <div
                className={`flex flex-col bg-base-200 bg-opacity-70 rounded-2xl shadow-lg px-5 py-4 w-full ${
                  showAnimation ? "first:animate-zoom" : ""
                }`}
                key={name}
              >
                <div className="flex justify-between" key={`${name}`}>
                  <span>{name}</span>
                  <span>{points}</span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};
