'use client';

import { useAnchorValues } from '../../../anchor/setup';
import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { publicKey } from "@metaplex-foundation/umi";

import { fetchAllDigitalAssetByUpdateAuthority } from '@metaplex-foundation/mpl-token-metadata';

export default function DashboardFeature() {
  const { collectionPDA, umi } = useAnchorValues();
  const [nfts, setNfts] = useState<any>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectionNFTs = async () => {
      try {
        const allNFTs = await fetchAllDigitalAssetByUpdateAuthority(
          umi,
          publicKey(collectionPDA),
        );

        const filteredNFTs = allNFTs.filter((nft: any) => nft.publicKey !== collectionPDA.toBase58()).sort((a: any, b: any) => a.metadata.name.localeCompare(b.metadata.name));
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
    <div>
      {loading ? (
        <CircularProgress />
      ) : (
        <div>
          {nfts && nfts.length > 0 ? (
            nfts.map((nft: any, index: any) => (
              <div key={index}>
                {/* <p>NFT Name: {nft.publicKey.toBase58()}</p>
                <p>Mint Address: {nft.publicKey}</p> */}
                {index}
              </div>
            ))
          ) : (
            <p>No NFTs found in the collection.</p>
          )}
        </div>
      )}
    </div>
  );
}