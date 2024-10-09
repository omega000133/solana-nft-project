use anchor_lang::{
    prelude::*,
    solana_program::{
        native_token::LAMPORTS_PER_SOL, 
        program::invoke_signed},
    system_program,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::{
    accounts::{MasterEdition, Metadata as MetadataAccount},
    instructions::{
        CreateMasterEditionV3, CreateMasterEditionV3InstructionArgs, CreateMetadataAccountV3,
        CreateMetadataAccountV3InstructionArgs, SetAndVerifySizedCollectionItem,
    },
    types::DataV2,
};

use crate::{error::ErrorCode, state::*};

pub fn buy_collection_nft<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, CreateNftInCollection<'info>>,
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

    // Generating signer seeds
    let signer_seeds: &[&[&[u8]]] = &[&[
        "platinum_collection".as_bytes(),
        &[ctx.bumps.collection_mint],
    ]];

    let treasury = &mut ctx.accounts.treasury;
    let count: u16;
    let amount = treasury.mint_price * LAMPORTS_PER_SOL;

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.treasury_wallet.to_account_info(),
            },
        ),
        amount,
    )?;

    if treasury.count == 0 {
        return Err(ErrorCode::MintEnded.into());
    } else {
        treasury.count -= 1;
        count = 99 - treasury.count;
    }

    let name = format!("Platinum Node #{}", count+1);

    let uri = format!("https://black-cheap-koala-709.mypinata.cloud/ipfs/QmU4kEZh9jKfbZLjuDV3aKcf8LwL8qPZ6c4vekPiddmjaW/{}.json", count);

    let symbol = "PNODE".to_string();

    // mint nft in collection
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.nft_mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.collection_mint.to_account_info(),
            },
            signer_seeds,
        ),
        1,
    )?;

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

    let create_token_instruction_data = &CreateMetadataAccountV3 {
        metadata: metadata_account_info.key(),
        mint: ctx.accounts.nft_mint.key(),
        mint_authority: ctx.accounts.collection_mint.key(), // use pda mint address as mint authority
        update_authority: (ctx.accounts.collection_mint.key(), true), // use pda mint as update authority
        payer: ctx.accounts.user.key(),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    }
    .instruction(CreateMetadataAccountV3InstructionArgs {
        data: DataV2 {
            name: name,
            symbol: symbol,
            uri: uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        is_mutable: true,
        collection_details: None,
    });
    invoke_signed(
        create_token_instruction_data,
        account_info.as_slice(),
        &signer_seeds,
    )?;

    let account_info_master_edition = vec![
        metadata_account_info.to_account_info(),
        master_edition_info.to_account_info(),
        ctx.accounts.nft_mint.to_account_info(),
        ctx.accounts.collection_mint.to_account_info(),
        ctx.accounts.user.to_account_info(),
        ctx.accounts.token_metadata_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];

    let create_master_edition_v3 = &CreateMasterEditionV3 {
        payer: ctx.accounts.user.key(),
        mint: ctx.accounts.nft_mint.key(),
        edition: master_edition_info.key(),
        mint_authority: ctx.accounts.collection_mint.key(),
        update_authority: ctx.accounts.collection_mint.key(),
        metadata: metadata_account_info.key(),
        token_program: ctx.accounts.token_program.key(),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    }
    .instruction(CreateMasterEditionV3InstructionArgs {
        max_supply: Some(0),
    });
    invoke_signed(
        create_master_edition_v3,
        account_info_master_edition.as_slice(),
        &signer_seeds,
    )?;

    let account_info_set_and_verify_sized_collection = vec![
        metadata_account_info.to_account_info(),
        collection_metadata_account_info.to_account_info(),
        ctx.accounts.collection_mint.to_account_info(),
        ctx.accounts.user.to_account_info(),
        collection_master_edition_info.to_account_info(),
    ];

    let set_and_verify_sized_collection_item = &SetAndVerifySizedCollectionItem {
        metadata: metadata_account_info.key(),
        collection_authority: ctx.accounts.collection_mint.key(),
        payer: ctx.accounts.user.key(),
        update_authority: ctx.accounts.collection_mint.key(),
        collection_mint: ctx.accounts.collection_mint.key(),
        collection: collection_metadata_account_info.key(),
        collection_master_edition_account: collection_master_edition_info.key(),
        collection_authority_record: None,
    }
    .instruction();

    invoke_signed(
        set_and_verify_sized_collection_item,
        account_info_set_and_verify_sized_collection.as_slice(),
        &signer_seeds,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateNftInCollection<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: Box<Account<'info, Treasury>>,
    #[account(
        mut,
        seeds = [b"platinum_collection"],
        bump,
    )]
    pub collection_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = user,
        mint::decimals = 0,
        mint::authority = collection_mint,
        mint::freeze_authority = collection_mint
    )]
    pub nft_mint: Account<'info, Mint>,

    ///CHECK:
    #[account(mut)]
    pub treasury_wallet: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = nft_mint,
        associated_token::authority = user
    )]
    pub token_account: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: account constraint checked in account trait
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
}
