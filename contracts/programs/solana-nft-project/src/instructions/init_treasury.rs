use std::mem::size_of;
use crate::state::*;

use anchor_lang::prelude::*;

pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    treasury.authority = ctx.accounts.authority.key();
    treasury.mint_price = 30;
    treasury.count = 100;
    
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    //32 + 8 + 8 + 8
    #[account(init, seeds = [b"treasury"], payer = authority, space = 8 + size_of::<Treasury>() , bump)] 
    pub treasury: Box<Account<'info, Treasury>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

