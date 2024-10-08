use anchor_lang::prelude::*;

declare_id!("6HHRqdp2BNWoswpdt3WLmMsBtLBuVdJ2GUjG9PMmDTuP");

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
}

