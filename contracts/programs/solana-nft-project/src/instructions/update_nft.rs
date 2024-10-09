use anchor_lang::{
    prelude::*,
    solana_program::program::invoke_signed,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ Mint, Token},
};
use mpl_token_metadata::{
    accounts::{MasterEdition, Metadata as MetadataAccount},
    instructions::{
        UpdateMetadataAccountV2, UpdateMetadataAccountV2InstructionArgs
    },
    types::DataV2,
};

use crate::error::ErrorCode;

pub fn update_nft<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, UpdateNftInCollection<'info>>,
    count: u8,
    status: String,
) -> Result<()> {
    let metadata_account_info = &ctx.remaining_accounts[0];
    let master_edition_info = &ctx.remaining_accounts[1];
    let collection_metadata_account_info = &ctx.remaining_accounts[2];
    let collection_master_edition_info = &ctx.remaining_accounts[3];

    // Validate metadata_account
    let expected_metadata_account_key = MetadataAccount::find_pda(&ctx.accounts.nft_mint.key()).0;
    if metadata_account_info.key != &expected_metadata_account_key {
        return Err(ErrorCode::InvalidMetadataAccount.into());
    }

    // Validate master_edition
    let expected_master_edition_key = MasterEdition::find_pda(&ctx.accounts.nft_mint.key()).0;
    if master_edition_info.key != &expected_master_edition_key {
        return Err(ErrorCode::InvalidMasterEditionAccount.into());
    }

    // Validate collection_metadata_account
    let expected_collection_metadata_account_key =
        MetadataAccount::find_pda(&ctx.accounts.collection_mint.key()).0;
    if collection_metadata_account_info.key != &expected_collection_metadata_account_key {
        return Err(ErrorCode::InvalidCollectionMetadataAccount.into());
    }

    // Validate collection_master_edition
    let expected_collection_master_edition_key =
        MasterEdition::find_pda(&ctx.accounts.collection_mint.key()).0;
    if collection_master_edition_info.key != &expected_collection_master_edition_key {
        return Err(ErrorCode::InvalidCollectionMasterEditionAccount.into());
    }

    if status != "active" && status != "frozen" && status != "burned" {
        return Err(ErrorCode::InvalidStatus.into());
    }

    // Generating signer seeds
    let signer_seeds: &[&[&[u8]]] = &[&[
        "platinum_collection".as_bytes(),
        &[ctx.bumps.collection_mint],
    ]];

    let name = "Plantinum Node".to_string();

    let uri = match status.as_str() {
        "active" => format!("https://black-cheap-koala-709.mypinata.cloud/ipfs/QmVzf4KKB6ztH82pczKDMyVegogfVGjVmyTb3ojz9zR7S2/{}.json", count-1),
        "frozen" => format!("https://black-cheap-koala-709.mypinata.cloud/ipfs/QmRaKJYS6UhTjWFTpxHxaSBrViwQHpc2Xg3ZUQ5A9TWMwg/{}.json", count-1),
        "burned" => format!("https://black-cheap-koala-709.mypinata.cloud/ipfs/QmV3eY6Aj2WmHYoMpxNZgpyUg45SHFdTvYtV6JgfPFJ27V/{}.json", count-1),
        _ => format!("https://black-cheap-koala-709.mypinata.cloud/ipfs/QmVzf4KKB6ztH82pczKDMyVegogfVGjVmyTb3ojz9zR7S2/{}.json", count-1),
    };
    
    let symbol = "PNODE".to_string();

    let account_info = vec![
        metadata_account_info.to_account_info(),
        ctx.accounts.nft_mint.to_account_info(),
        ctx.accounts.collection_mint.to_account_info(),
        ctx.accounts.user.to_account_info(),
        ctx.accounts.token_metadata_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];

    let update_metadata_instruction_data = &UpdateMetadataAccountV2 {
        metadata: metadata_account_info.key(),
        update_authority: ctx.accounts.collection_mint.key(),
    }
    .instruction(UpdateMetadataAccountV2InstructionArgs {
        data: Some(DataV2 {
            name: name,
            symbol: symbol,
            uri: uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        }),
        new_update_authority: Some(ctx.accounts.collection_mint.key()),
        primary_sale_happened: Some(false),
        is_mutable: Some(true),
    });

    invoke_signed(
        update_metadata_instruction_data,
        account_info.as_slice(),
        &signer_seeds,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateNftInCollection<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"platinum_collection"],
        bump,
    )]
    pub collection_mint: Account<'info, Mint>,

    #[account(
        mut,
        mint::decimals = 0,
        mint::authority = collection_mint,
        mint::freeze_authority = collection_mint
    )]
    pub nft_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: account constraint checked in account trait
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
}