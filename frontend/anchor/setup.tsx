"use client";

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
    AnchorWallet,
    useConnection,
    useWallet,
} from "@solana/wallet-adapter-react";
import { SolanaNftProject, IDL } from "./solana_nft_project";
import { PublicKey } from "@solana/web3.js";

export const useAnchorValues = () => {
    const { connection } = useConnection();

    const wallet = useWallet();

    const provider = new AnchorProvider(connection, wallet as AnchorWallet, {
        commitment: "confirmed",
    });

    const programId: string = IDL.address;
    const program = new Program<SolanaNftProject>(IDL, provider);


    return {
        program,
        connection,
        programId,
    };
};
