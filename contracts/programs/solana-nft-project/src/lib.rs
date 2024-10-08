use anchor_lang::prelude::*;

declare_id!("ECPrWPH3Pgrwt77P2Bnxdi319eFuDRPMbv64xdx9kiRT");

mod instructions;
mod state;
#[program]
pub mod solana_nft_project {
    use super::*;
    pub use instructions::*;

    pub fn init_nft(ctx: Context<InitNFT>, name: String, symbol: String, uri: String) -> Result<()> {
        instructions::init_nft(ctx, name, symbol, uri)
    }

    pub fn create_collection_nft(ctx: Context<CreateCollectionNft>, uri: String, name: String, symbol: String) -> Result<()> {
        instructions::create_collection_nft(ctx, uri, name, symbol)
    }

    pub fn init_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        instructions::initialize_treasury(ctx)
    }
    pub fn buy_nft<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, CreateNftInCollection<'info>>) -> Result<()> {
        instructions::buy_collection_nft(ctx)
    }
}

