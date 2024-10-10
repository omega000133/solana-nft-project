import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaNftProject } from "../target/types/solana_nft_project";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
    findCollectionAuthorityRecordPda,
    findMasterEditionPda,
    findMetadataPda,
    mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { Keypair, PublicKey } from "@solana/web3.js";

describe("mint nft in collection", async () => {
    // Configured the client to use the devnet cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.SolanaNftProject as Program<SolanaNftProject>;


    const signer = provider.wallet;
    const connection = provider.connection;

    const umi = createUmi("https://staging-rpc.dev2.eclipsenetwork.xyz")
        .use(walletAdapterIdentity(signer))
        .use(mplTokenMetadata());


    const [collectionPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("platinum_collection")],
        program.programId
    );

    const [treasuryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        program.programId
    );

    before(async () => {
        await program.methods
            .initTreasury()
            .accounts({
                authority: signer.publicKey,
            })
            .rpc();
    })

    it("mint nft in collection", async () => {
        let treasury = await program.account.treasury.fetch(treasuryPda);
        let acccInfo = await provider.connection.getAccountInfo(treasuryPda);
        let collectionAccInfo = await provider.connection.getAccountInfo(collectionPDA);

        if (!acccInfo) {
            console.log("Treasury acct is not initialized, init Treasury");
            return;
        }

        if (!collectionAccInfo) {
            console.log("Collection NFT is not Generated yet");
            return;
        }

        // console.log("Treasury acc:", acccInfo);
        console.log("Contract count before tx:", treasury.count)

        console.log("collection pda:", collectionPDA.toBase58())

        let amount = 1;

        let categoryItemsAvailable = treasury.count;  // Get the relevant category count  : treasury.furRealDealCount, treasury.purrmiumPackCount

        if (amount > categoryItemsAvailable) {
            throw new Error(`${amount} Nfts of this category are not available, Available Items Availabele: ${categoryItemsAvailable}, Try with less amount or another category`);
        }

        try {
            const modifyComputeUnits =
                anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
                    units: 400_000,
                });

            const mint = Keypair.generate();
            const treasuryWallet = Keypair.generate();

            console.log("mint:", mint.publicKey.toBase58());

            const metadataPDA = findMetadataPda(umi, {
                mint: publicKey(mint.publicKey),
            })[0];

            const masterEditionPDA = findMasterEditionPda(umi, {
                mint: publicKey(mint.publicKey),
            })[0];

            let collectionMasterEditionPDA = findMasterEditionPda(umi, {
                mint: publicKey(collectionPDA),
            })[0];

            // derive the metadata account
            let collectionMetadataPDA = findMetadataPda(umi, {
                mint: publicKey(collectionPDA),
            })[0];

            // let collectionAuthorityRecordPDA = findCollectionAuthorityRecordPda(umi, {
            //     mint: publicKey(collectionPDA),
            //     collectionAuthority: publicKey(collectionPDA)
            // })[0];

            // console.log('collection authority address ===>', collectionAuthorityRecordPDA);
            

            const remainingAccounts: Array<any> = [
                { pubkey: new PublicKey(metadataPDA), isWritable: true, isSigner: false },
                { pubkey: new PublicKey(masterEditionPDA), isWritable: true, isSigner: false },
                { pubkey: new PublicKey(collectionMetadataPDA), isWritable: true, isSigner: false },
                { pubkey: new PublicKey(collectionMasterEditionPDA), isWritable: true, isSigner: false },
                // { pubkey: new PublicKey(collectionAuthorityRecordPDA), isWritable: true, isSigner: false },
            ];

            const tx = await program.methods
                .buyNft()
                .accounts({
                    user: signer.publicKey,
                    nftMint: mint.publicKey,
                    treasuryWallet: treasuryWallet.publicKey,
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
            transferTransaction.feePayer = provider.wallet.publicKey;
            transferTransaction.sign(mint);

            let txFee = await transferTransaction.getEstimatedFee(provider.connection);

            const walletBalance = await provider.connection.getBalance(provider.wallet.publicKey);

            if (walletBalance < txFee) {
                throw new Error(`Insufficient balance for transacation. Required: ${txFee}, Available User wallet balance: ${walletBalance}`);
            }

            const signTransaction = await provider.wallet.signTransaction(transferTransaction);
            const txid = await provider.connection.sendRawTransaction(
                signTransaction.serialize(),
                {
                    skipPreflight: false,
                }
            );

            console.log("confrim tx:", `https://explorer.solana.com/tx/${txid}?cluster=devnet`);
            console.log("Minted nft in collection:", `https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`);

        } catch (err) {
            console.log("ERROR:", err)
        }
    });
});