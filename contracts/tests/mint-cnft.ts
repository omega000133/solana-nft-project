import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaNftProject } from "../target/types/solana_nft_project";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
    findMasterEditionPda,
    findMetadataPda,
    mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";

describe("create collection nft", async () => {
    // Configured the client to use the devnet cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.SolanaNftProject as Program<SolanaNftProject>;


    const signer = provider.wallet;
    const connection = provider.connection;

    const umi = createUmi("https://staging-rpc.dev2.eclipsenetwork.xyz")
        .use(walletAdapterIdentity(signer))
        .use(mplTokenMetadata());

    const testMetadata = {
        uri: "https://arweave.net/h19GMcMz7RLDY7kAHGWeWolHTmO83mLLMNPzEkF32BQ",
        name: "NAME",
        symbol: "SYMBOL"
    };

    const testCollectionMetadata = {
        uri: "https://black-cheap-koala-709.mypinata.cloud/ipfs/QmPQmjgC3V1WeULvfFffqdVJRZZKodexsRFMmupLUh7r3M/collection.json",
        name: "Platinum Node",
        symbol: "PNODE"
    };

    const [collectionPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("platinum_collection")],
        program.programId
    );

    const [treasuryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        program.programId
    );

    it("create collection nft!", async () => {
        //derive the master edition pda
        let collectionMasterEditionPDA = findMasterEditionPda(umi, {
            mint: publicKey(collectionPDA),
        })[0];

        // derive the metadata account
        let collectionMetadataPDA = findMetadataPda(umi, {
            mint: publicKey(collectionPDA),
        })[0];

        try {
            const modifyComputeUnits =
                anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
                    units: 300_000,
                });

            const tx = await program.methods
                .createCollectionNft(
                    testCollectionMetadata.uri,
                    testCollectionMetadata.name,
                    testCollectionMetadata.symbol
                )
                .accounts({
                    authority: signer.publicKey,
                    metadataAccount: collectionMetadataPDA,
                    masterEdition: collectionMasterEditionPDA,
                })
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

            if (walletBalance < txFee) {
                throw new Error(`Insufficient balance for transacation. Required: ${txFee}, Available User wallet balance: ${walletBalance}`);
            }

            const x = await provider.sendAndConfirm(transferTransaction);

            console.log("confrim tx:", `https://explorer.solana.com/tx/${x}?cluster=devnet`);

        } catch (err) {
            console.log("ERROR:", err)
        }
    });
});