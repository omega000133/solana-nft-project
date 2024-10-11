"use client";

import * as React from 'react';

import * as anchor from "@coral-xyz/anchor";
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorValues } from '../../../anchor/setup';
import toast from 'react-hot-toast';

export default function MintNFT() {
    const { program, mint, treasuryWallet, remainingAccounts, connection, provider } = useAnchorValues();
    const { publicKey, connected } = useWallet();

    const mintNFT = async () => {
        try {
            if (!connected) {
                throw new Error("Wallet not connected");
            }

            const modifyComputeUnits =
                anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
                    units: 400_000,
                });
            const tx = await program.methods
                .buyNft()
                .accounts({
                    user: publicKey!,
                    nftMint: mint.publicKey,
                    treasuryWallet: treasuryWallet,
                })
                .signers([mint])
                .remainingAccounts(remainingAccounts)
                .transaction();

            let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');

            const transferTransaction = new anchor.web3.Transaction().add(
                modifyComputeUnits,
                tx
            );

            transferTransaction.recentBlockhash = blockhash;
            transferTransaction.feePayer = publicKey!;
            transferTransaction.sign(mint);

            let txFee = await transferTransaction.getEstimatedFee(connection);

            const walletBalance = await connection.getBalance(publicKey!);

            if (walletBalance < txFee!) {
                throw new Error(`Insufficient balance for transacation. Required: ${txFee}, Available User wallet balance: ${walletBalance}`);
            }

            const signTransaction = await provider.wallet.signTransaction(transferTransaction);
            const txid = await connection.sendRawTransaction(
                signTransaction.serialize(),
                {
                    skipPreflight: false,
                }
            );

            // Wait for transaction confirmation
            await connection.confirmTransaction(txid);

            toast.success("You have successfully minted an NFT!");
        } catch (err) {
            console.log("ERROR:", err)
        }
    }

    return (
        <div className="">
            <button
                className="bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                onClick={mintNFT}
            >
                Mint NFT
            </button>
        </div>
    );
}
