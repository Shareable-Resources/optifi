use crate::errors::ErrorCode;
use crate::state::exchange::Exchange;
use crate::utils::PREFIX_OPTIFI_EXCHANGE;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(bump:u8, data: InitializeExchangeData)]
pub struct InitializeOptiFiExchange<'info> {
    /// optifi exchange account
    #[account(init,
         seeds=[PREFIX_OPTIFI_EXCHANGE.as_bytes(),
         data.uuid.as_bytes(),
         ], payer=payer, bump=bump, space=10240)]
    pub optifi_exchange: ProgramAccount<'info, Exchange>,
    /// optifi exchange's authority
    pub authority: AccountInfo<'info>,
    /// usdc central pool for fund settlement, its authority should be the central_usdc_pool_auth_pda
    //#[account(constraint =  accessor::mint(&usdc_central_pool)? == data.usdc_mint && accessor::authority(&usdc_central_pool)?
    //== get_central_usdc_pool_auth_pda(&optifi_exchange.key(), program_id).0) ]
    pub usdc_central_pool: AccountInfo<'info>,
    #[account(mut, signer)]
    pub payer: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Default, AnchorSerialize, AnchorDeserialize)]
pub struct InitializeExchangeData {
    /// id of the OptiFi Exchange
    pub uuid: String,
    /// OptiFi Exchange version
    pub version: u32,
    /// the authority address
    pub exchange_authority: Pubkey,
    pub owner: Pubkey, //TODO: do we need this??
    /// the recognized usdc token mint
    pub usdc_mint: Pubkey,
    /// trusted oracle account for BTC sopt price
    pub btc_spot_oracle: Pubkey,
    /// trusted oracle account for ETH sopt price
    pub eth_spot_oracle: Pubkey,
    /// trusted oracle account for BTC IV
    pub btc_iv_oracle: Pubkey,
    /// trusted oracle account for ETH IV
    pub eth_iv_oracle: Pubkey,
}

pub fn handler(
    ctx: Context<InitializeOptiFiExchange>,
    _bump: u8,
    data: InitializeExchangeData,
) -> ProgramResult {
    if data.uuid.len() != 6 {
        return Err(ErrorCode::UuidMustBeExactly6Length.into());
    }

    let optifi_exchange = &mut ctx.accounts.optifi_exchange;
    let usdc_central_pool = &ctx.accounts.usdc_central_pool;
    optifi_exchange.uuid = data.uuid;
    optifi_exchange.version = data.version;
    optifi_exchange.exchange_authority = data.exchange_authority;
    optifi_exchange.owner = data.owner;
    optifi_exchange.usdc_mint = data.usdc_mint;
    optifi_exchange.usdc_central_pool = usdc_central_pool.key();
    optifi_exchange.btc_spot_oracle = data.btc_spot_oracle;
    optifi_exchange.eth_spot_oracle = data.eth_spot_oracle;
    optifi_exchange.btc_iv_oracle = data.btc_iv_oracle;
    optifi_exchange.eth_iv_oracle = data.eth_iv_oracle;

    msg!("optifi exchange is initialized successfully");
    Ok(())
}
