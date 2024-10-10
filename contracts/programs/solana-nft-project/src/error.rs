use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid Metadata Account provided.")]
    InvalidMetadataAccount,
    #[msg("Invalid Master Edition Account provided.")]
    InvalidMasterEditionAccount,
    #[msg("Invalid Collection Metadata Account provided.")]
    InvalidCollectionMetadataAccount,
    #[msg("Invalid Collection Master Edition Account provided.")]
    InvalidCollectionMasterEditionAccount,
    #[msg("Unauthorized action.")]
    Unauthorized,
    #[msg("Insufficient funds in the treasury account.")]
    InsufficientFunds,
    #[msg("Discount can not be more than 100")]
    InvalidDiscount,
    #[msg("Price Feed is down at the moment")]
    PriceFeedIsDown,
    #[msg("Invalid Price Feed Address")]
    InvalidPriceFeed,
    #[msg("Platinum Node Category Mint Limit Exceeded")]
    LimitExceeded,
    #[msg("Platinum Node collection has ended. No more NFTs are available to mint in this category. Check other categories")]
    MintEnded,
    #[msg("Warning: Invalid Whitelist token, Only whitelisted tokens are allowed")]
    InvalidMint,
    #[msg("Invalid status")]
    InvalidStatus
}