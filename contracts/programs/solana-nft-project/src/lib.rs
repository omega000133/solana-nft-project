use anchor_lang::prelude::*;

declare_id!("6J2Bq446yNZYswx5svN9QkpZAZ2VTGSMXJcWkphoCXPB");

#[program]
pub mod solana_nft_project {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
