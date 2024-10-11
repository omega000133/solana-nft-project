"use client";

import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
    AnchorWallet,
    useConnection,
    useWallet,
} from "@solana/wallet-adapter-react";
import { SolanaNftProject, IDL } from "./solana_nft_project";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
    findMasterEditionPda,
    findMetadataPda,
    mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { Keypair, PublicKey } from "@solana/web3.js";

export const useAnchorValues = () => {
    const { connection } = useConnection();

    const wallet = useWallet();

    const provider = new AnchorProvider(connection, wallet as AnchorWallet, {
        commitment: "confirmed",
    });

    const programId: string = IDL.address;
    const program = new Program<SolanaNftProject>(IDL, provider);

    // const umi = createUmi("https://staging-rpc.dev2.eclipsenetwork.xyz")
    const umi = createUmi("https://api.devnet.solana.com")
        .use(walletAdapterIdentity(wallet))
        .use(mplTokenMetadata());

    const [collectionPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("platinum_collection")],
        program.programId
    );

    const mint = Keypair.generate();

    const metadataPDA = findMetadataPda(umi, {
        mint: publicKey(mint.publicKey),
    })[0];

    const masterEditionPDA = findMasterEditionPda(umi, {
        mint: publicKey(mint.publicKey),
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

    const treasuryWallet = new PublicKey(process.env.NEXT_PUBLIC_TEASURY_WALLET!);

    return {
        program,
        provider,
        connection,
        programId,
        mint,
        remainingAccounts,
        treasuryWallet,
        collectionPDA,
        umi
    };
};
