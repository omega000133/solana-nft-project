// components/NFTCard.tsx
import React from 'react';
import { FaArrowUpRightFromSquare } from "react-icons/fa6";

type NFTCardProps = {
    mint: string;
    name: string;
    status: string;
    imageUrl: string;
};

const NFTCard: React.FC<NFTCardProps> = ({ mint, name, status, imageUrl }) => {
    return (
        <div className="box-border bg-[#ffffff0f] rounded-xl p-2 shadow-lg text-center">
            <div className="w-full">
                <video src={imageUrl} autoPlay loop muted className="rounded-xl" />
            </div>
            <div className="mt-4 px-2">
                <p className="text-xl font-bold text-white text-left">{name}</p>
                <div className='flex justify-between'>
                    <p className={`text-lg font-semibold text-left ${status === 'active' ? 'text-green-500' :
                            status === 'frozen' ? 'text-blue-500' :
                                status === 'burned' ? 'text-red-500' :
                                    'text-green-500'
                        }`}>{status}</p>
                    <a
                        href={`https://solscan.io/token/${mint}/?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-500 hover:underline"
                    >
                        <FaArrowUpRightFromSquare />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default NFTCard;