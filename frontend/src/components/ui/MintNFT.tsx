"use client";

import * as React from 'react';

import * as anchor from "@coral-xyz/anchor";
import { CircularProgress } from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorValues } from '../../../anchor/setup';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function MintNFT() {
    const { program, mint, treasuryWallet, remainingAccounts, connection, provider } = useAnchorValues();
    const { publicKey, connected } = useWallet();

    const [loading, setLoading] = useState(false);

    const mintNFT = async () => {
        setLoading(true);
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
            toast.error("An error occurred while minting the NFT.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex-none">
            <button
                className="wallet-adapter-button-trigger wallet-adapter-button"
                onClick={mintNFT}
                disabled={loading}
            >
                {loading ? <CircularProgress size={20} /> : "Mint NFT"}
            </button>
        </div>
    );
}
