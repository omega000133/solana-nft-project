// components/NFTCard.tsx
import React from 'react';
import Image from 'next/image';

type NFTCardProps = {
    mint: string;
    name: string;
    status: string;
    imageUrl: string;
};

const NFTCard: React.FC<NFTCardProps> = ({ mint, name, status, imageUrl }) => {
    return (
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg text-center w-56">
            <div className="relative w-full h-64">
                <Image src={imageUrl} alt={name} layout="fill" objectFit="cover" className="rounded-md" />
            </div>
            <div className="mt-4">
                <p className="text-xl font-bold text-white text-left">{name}</p>
                <div className='flex justify-between'>
                    <p className="text-lg font-semibold text-purple-400 text-left">{status}</p>
                    <a
                        href={`https://solscan.io/token/${mint}/?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-500 hover:underline"
                    >
                        ↗
                    </a>
                </div>
            </div>
        </div>
    );
};

export default NFTCard;