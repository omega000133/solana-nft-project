use anchor_lang::prelude::*;

declare_id!("FuGqSNmxgcdcL69xtDBCBQtxFXH142cM5Fw4r11oHhGC");

mod instructions;
mod state;
mod error;
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

    pub fn update_nft<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, UpdateNftInCollection<'info>>, count:u8, status:String) -> Result<()> {
        instructions::update_nft(ctx, count, status)
    }
}

