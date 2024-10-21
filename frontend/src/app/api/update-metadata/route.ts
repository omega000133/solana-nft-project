'use client'

import * as anchor from "@coral-xyz/anchor";
import {
    findMasterEditionPda,
    findMetadataPda,
    mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    AnchorWallet,
} from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { getNftId } from "@/app/utils/getNftId";
import { NextResponse } from "next/server";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL, SolanaNftProject } from "../../../../anchor/solana_nft_project";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";

export async function GET(request: Request) {
    return new Response('update metadata')
}

export async function POST(req: Request) {
    try {
        const { mint, status, walletPublicKey } = await req.json(); // Parse JSON body

        const connection = new Connection("https://api.devnet.solana.com");
        const wallet = new PublicKey(walletPublicKey);

        const provider = new AnchorProvider(connection,
            { publicKey: wallet } as anchor.Wallet,
            {
                commitment: "confirmed",
            });

        const program = new Program<SolanaNftProject>(IDL, provider);
        const umi = createUmi("https://api.devnet.solana.com")
            .use(walletAdapterIdentity({
                publicKey: wallet,
            }))
            .use(mplTokenMetadata());

        const [collectionPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("platinum_collection")],
            program.programId
        );

        const modifyComputeUnits =
            anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
                units: 400_000,
            });

        const nftId = await getNftId(mint);
        const mintAddress = new PublicKey(mint);

        const metadataPDA = findMetadataPda(umi, {
            mint: publicKey(mintAddress),
        })[0];

        const masterEditionPDA = findMasterEditionPda(umi, {
            mint: publicKey(mintAddress),
        })[0];
        let collectionMasterEditionPDA = findMasterEditionPda(umi, {
            mint: publicKey(collectionPDA),
        })[0];

        let collectionMetadataPDA = findMetadataPda(umi, {
            mint: publicKey(collectionPDA),
        })[0];

        const remainingAccounts: Array<any> = [
            { pubkey: new PublicKey(metadataPDA), isWritable: true, isSigner: false },
            { pubkey: new PublicKey(masterEditionPDA), isWritable: true, isSigner: false },
            { pubkey: new PublicKey(collectionMetadataPDA), isWritable: true, isSigner: false },
            { pubkey: new PublicKey(collectionMasterEditionPDA), isWritable: true, isSigner: false },
        ];

        const tx = await program.methods
            .updateNft(
                nftId,
                status
            )
            .accounts({
                user: new PublicKey(wallet),
                nftMint: mintAddress
            })
            .remainingAccounts(remainingAccounts)
            .transaction();


        let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');

        const transferTransaction = new anchor.web3.Transaction().add(
            modifyComputeUnits,
            tx
        );

        transferTransaction.recentBlockhash = blockhash;
        transferTransaction.feePayer = provider.wallet.publicKey;

        let txFee = await transferTransaction.getEstimatedFee(provider.connection);

        const walletBalance = await provider.connection.getBalance(provider.wallet.publicKey);

        if (walletBalance < txFee!) {
            throw new Error(`Insufficient balance for transacation. Required: ${txFee}, Available User wallet balance: ${walletBalance}`);
        }

        const signTransaction = await provider.wallet.signTransaction(transferTransaction);
        const txid = await provider.connection.sendRawTransaction(
            signTransaction.serialize(),
            {
                skipPreflight: false,
            }
        );

        console.log("txid: ", txid);

        return NextResponse.json({ success: true, message: 'Metadata updated' }, { status: 200 });
    } catch (error) {
        console.error("Error updating metadata: ", error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
