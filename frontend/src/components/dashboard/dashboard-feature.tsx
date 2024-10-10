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

        const filteredNFTs = [
          {
            name: 'NFT 1',
            mint: 'GrXrSnLaME3g9o7sTcH6T6vvKLN3kr1PnS8UX7tZxaB2',
            imageUrl: 'https://black-cheap-koala-709.mypinata.cloud/ipfs/QmW16rjQ2QAQnXJBEvQGKkYWtCap7RoXZJWLG2bfWVZo7d/frozen.gif',
            status: 'frozen'
          },
          {
            name: 'NFT 2',
            mint: 'GrXrSnLaME3g9o7sTcH6T6vvKLN3kr1PnS8UX7tZxaB2',
            imageUrl: 'https://black-cheap-koala-709.mypinata.cloud/ipfs/QmW16rjQ2QAQnXJBEvQGKkYWtCap7RoXZJWLG2bfWVZo7d/active.gif',
            status: 'active'
          },
          {
            name: 'NFT 3',
            mint: 'GrXrSnLaME3g9o7sTcH6T6vvKLN3kr1PnS8UX7tZxaB2',
            imageUrl: 'https://black-cheap-koala-709.mypinata.cloud/ipfs/QmW16rjQ2QAQnXJBEvQGKkYWtCap7RoXZJWLG2bfWVZo7d/frozen.gif',
            status: 'active'
          }
        ];

        console.log(filteredNFTs);
        setNfts(filteredNFTs);
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
        <CircularProgress />
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