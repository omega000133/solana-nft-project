'use client';

import { useAnchorValues } from '../../../anchor/setup';
import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { publicKey } from "@metaplex-foundation/umi";

import { fetchAllDigitalAssetByUpdateAuthority } from '@metaplex-foundation/mpl-token-metadata';
import NFTCard from '../nft-card/nft-card';

export default function DashboardFeature() {
  const { collectionPDA, umi } = useAnchorValues();
  const [nfts, setNfts] = useState<any>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectionNFTs = async () => {
      try {
        // const allNFTs = await fetchAllDigitalAssetByUpdateAuthority(
        //   umi,
        //   publicKey(collectionPDA),
        // );

        // const filteredNFTs = await Promise.all(
        //   allNFTs
        //     .filter((nft: any) => nft.publicKey !== collectionPDA.toBase58())
        //     .sort((a: any, b: any) => a.metadata.name.localeCompare(b.metadata.name))
        //     .map(async (nft) => {
        //       try {
        //         const response = await fetch(nft.metadata.uri);
        //         const metadata = await response.json();
        //         return {
        //           name: metadata.name,
        //           mint: nft.publicKey,
        //           imageUrl: metadata.image,
        //           status: metadata.attributes[0].value
        //         };
        //       } catch (error) {
        //         return {
        //           name: '',
        //           mint: '',
        //           imageUrl: '',
        //           status: ''
        //         };
        //       }
        //     }));

        const url =
          `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "my-id",
            method: "getAssetsByGroup",
            params: {
              groupKey: "collection",
              groupValue: collectionPDA,
              page: 1,
              limit: 1000,
            },
          }),
        });
        const { result } = await response.json();

        const nfts = result.items
          .sort((a: any, b: any) => {
            const numA = parseInt(a.content.metadata.name.match(/\d+$/)?.[0] || "0", 10);
            const numB = parseInt(b.content.metadata.name.match(/\d+$/)?.[0] || "0", 10);

            return numA - numB;
          })
          .map((item: any) => {
            return {
              mint: item.id,
              name: item.content.metadata.name,
              imageUrl: item.content.links.image,
              status: item.content.metadata.attributes[0].value
            }
          })

        console.log(nfts);
        setNfts(nfts);

        // console.log(filteredNFTs);
        // setNfts(filteredNFTs);
      } catch (error) {
        console.error('Error fetching collection NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionNFTs();
  }, []);

  return (
    <div className='mt-20'>
      {loading ? (
        <div
        className='text-center'>
          <CircularProgress />
          </div>
      ) : (
        <div>
          {nfts && nfts.length > 0 ? (
            <div className="p-8">
              <h1 className="text-3xl font-bold text-white mb-8 text-center">NFT Collection</h1>
              <div className="flex flex-wrap gap-8">
                {nfts.map((nft: any, index: any) => (
                  <NFTCard
                    key={index}
                    mint={nft.mint}
                    name={nft.name}
                    status={nft.status}
                    imageUrl={nft.imageUrl}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p>No NFTs found in the collection.</p>
          )}
        </div>

      )}
    </div>
  );
}