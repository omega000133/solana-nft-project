use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, mint_to, MintTo, Token, TokenAccount, }};
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use mpl_token_metadata::{ 
    accounts::{ MasterEdition, Metadata as MetadataAccount },
    types::{CollectionDetails, DataV2, Creator},
    instructions::{CreateMasterEditionV3, CreateMetadataAccountV3, SignMetadata, CreateMasterEditionV3InstructionArgs, CreateMetadataAccountV3InstructionArgs }
};
// use spl_token::state::Account as SplTokenAccount;


pub fn create_collection_nft(
    ctx: Context<CreateCollectionNft>,
    uri: String,
    name: String,
    symbol: String
) -> Result<()> {
    let signer_seeds: &[&[&[u8]]] = &[&[
        "platinum_collection".as_bytes(),
        &[ctx.bumps.collection_mint],
    ]];
    msg!("SIGNER SEEDS GENERATED");

    // mint collection nft
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.collection_mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.collection_mint.to_account_info(),
            },
            signer_seeds,
        ),
        1,
    )?;

    let account_info = vec![
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.collection_mint.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.token_metadata_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];

    let create_token_instruction_data = &CreateMetadataAccountV3{
        metadata: ctx.accounts.metadata_account.key(),
        mint: ctx.accounts.collection_mint.key(),
        mint_authority: ctx.accounts.collection_mint.key(), // use pda mint address as mint authority
        update_authority: (ctx.accounts.collection_mint.key(), true), // use pda mint as update authority
        payer: ctx.accounts.authority.key(),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    }
    .instruction(CreateMetadataAccountV3InstructionArgs {
        data: DataV2 {
            name: name,
            symbol: symbol,
            uri: uri,
            seller_fee_basis_points: 1000,
            creators: Some(vec![Creator {
                address: ctx.accounts.authority.key(),
                verified: false,
                share: 100,
            }]),
            collection: None,
            uses: None,
        },
        is_mutable: true,
        collection_details: Some(CollectionDetails::V1 { size: 0 }), 
    });
    invoke_signed(
        create_token_instruction_data,
        account_info.as_slice(),
        &signer_seeds,
    )?;

    let account_info_master_edition = vec![
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.master_edition.to_account_info(),
        ctx.accounts.collection_mint.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.token_metadata_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];

    let create_master_edition_v3 = &CreateMasterEditionV3 {
        payer: ctx.accounts.authority.key(),
        mint: ctx.accounts.collection_mint.key(),
        edition: ctx.accounts.master_edition.key(),
        mint_authority: ctx.accounts.collection_mint.key(),
        update_authority: ctx.accounts.collection_mint.key(),
        metadata: ctx.accounts.metadata_account.key(),
        token_program: ctx.accounts.token_program.key(),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    }.instruction(CreateMasterEditionV3InstructionArgs{
        max_supply: Some(0),
    });
    invoke_signed(
        create_master_edition_v3,
        account_info_master_edition.as_slice(),
        &signer_seeds,
    )?;


    let account_info_sign_data = vec![
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.authority.to_account_info(),
    ];

    let sign_metadata_instruction = &SignMetadata {
        creator: ctx.accounts.authority.key(),
        metadata: ctx.accounts.metadata_account.key()
    }.instruction();
    invoke(
        sign_metadata_instruction,
        account_info_sign_data.as_slice(),
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(uri: String, name: String, symbol: String)]
pub struct CreateCollectionNft<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        seeds = [b"platinum_collection"],
        bump,
        payer = authority,
        mint::decimals = 0,
        mint::authority = collection_mint,
        mint::freeze_authority = collection_mint
    )]
    pub collection_mint: Account<'info, Mint>,

    /// CHECK:
    #[account(
        mut,
        address=MetadataAccount::find_pda(&collection_mint.key()).0
    )]
    pub metadata_account: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
        mut,
        address=MasterEdition::find_pda(&collection_mint.key()).0
    )]
    pub master_edition: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = collection_mint,
        associated_token::authority = authority
    )]
    pub token_account: Box<Account<'info, TokenAccount>>,
    // #[account(mut, seeds = [b"counter"], bump)]
    // pub counter: Account<'info, Counter>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: account constraint checked in account trait
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
}
