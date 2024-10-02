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

describe("init nft", async () => {
  // Configured the client to use the devnet cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolanaNftProject as Program<SolanaNftProject>;


  const signer = provider.wallet;

  // const umi = createUmi("https://api.devnet.solana.com")
  //   .use(walletAdapterIdentity(signer))
  //   .use(mplTokenMetadata());

    const umi = createUmi("https://staging-rpc.dev2.eclipsenetwork.xyz")
    .use(walletAdapterIdentity(signer))
    .use(mplTokenMetadata());

    // https://staging-rpc.dev2.eclipsenetwork.xyz

  const mint = anchor.web3.Keypair.generate();

  // derive the metadata account
  let metadataAccount = findMetadataPda(umi, {
    mint: publicKey(mint.publicKey),
  })[0];

  //derive the master edition pda
  let masterEditionAccount = findMasterEditionPda(umi, {
    mint: publicKey(mint.publicKey),
  })[0];

  const metadata = {
    name: "Kobeni",
    symbol: "kBN",
    uri: "https://raw.githubusercontent.com/687c/solana-nft-native-client/main/metadata.json",
  };

  it("mints nft!", async () => {
    const tx = await program.methods
      .initNft(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        signer: provider.publicKey,
        mint: mint.publicKey,
        metadataAccount,
        masterEditionAccount,
      })
      .signers([mint])
      .rpc();

    console.log(
      `mint nft tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
    console.log(
      `minted nft: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
    );
  });
});