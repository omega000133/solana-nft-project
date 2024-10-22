import { log } from "console";

const url =
    `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;

export const getNftId = async (mint: string) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'my-id',
            method: 'getAsset',
            params: {
                id: mint
            },
        }),
    });
    const { result } = await response.json();
    const nftId = getNFTNumber(result.content.metadata.name);
    return Number(nftId);
}

function getNFTNumber(nftName: string) {
    const regex = /#(\d+)/;
    const match = nftName.match(regex);
    if (match) {
        return match[1];  // Extracts the number part
    }
    return null;
}