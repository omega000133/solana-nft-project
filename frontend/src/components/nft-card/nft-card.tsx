// components/NFTCard.tsx
import React from 'react';
import Image from 'next/image';

type NFTCardProps = {
    name: string;
    status: string;
    imageUrl: string;
};

const NFTCard: React.FC<NFTCardProps> = ({ name, status, imageUrl }) => {
    return (
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg text-center">
            <div className="relative w-full h-64">
                <Image src={imageUrl} alt={name} layout="fill" objectFit="cover" className="rounded-md" />
            </div>
            <div className="mt-4">
                <p className="text-xl font-bold text-white">{name}</p>
                <p className="text-lg font-semibold text-purple-400">{status}</p>
            </div>
        </div>
    );
};

export default NFTCard;