use anchor_lang::prelude::*;

declare_id!("6HHRqdp2BNWoswpdt3WLmMsBtLBuVdJ2GUjG9PMmDTuP");

mod instructions;
#[program]
pub mod solana_nft_project {
    use super::*;
    pub use instructions::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn init_nft(ctx: Context<InitNFT>, name: String, symbol: String, uri: String) -> Result<()> {
        instructions::init_nft(ctx, name, symbol, uri)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
