use crate::financial::get_serum_spot_price;
use crate::serum_new_order;
use crate::state::{LiquidationState, OptifiMarket, UserAccount};
use crate::utils::PREFIX_USER_ACCOUNT;
use anchor_lang::{prelude::*, ProgramAccount};
use anchor_spl::token::{self};
use serum_dex::matching::{OrderType, Side};
use serum_dex::state::Market;

#[derive(Accounts)]
pub struct LiquidatePosition<'info> {
    pub exchange: AccountInfo<'info>,

    #[account(mut, constraint=user_account.is_in_liquidation)]
    pub user_account: ProgramAccount<'info, UserAccount>,

    #[account(mut, constraint = liquidation_state.user_account == user_account.key())]
    pub liquidation_state: ProgramAccount<'info, LiquidationState>,

    pub optifi_market: ProgramAccount<'info, OptifiMarket>,

    #[account(mut, constraint = serum_market.key() == optifi_market.serum_market)]
    pub serum_market: AccountInfo<'info>,
    pub serum_dex_program_id: AccountInfo<'info>,
    #[account(mut)]
    pub bids: AccountInfo<'info>,
    #[account(mut)]
    pub asks: AccountInfo<'info>,
    #[account(mut)]
    pub event_queue: AccountInfo<'info>,
    #[account(mut)]
    pub request_queue: AccountInfo<'info>,

    #[account(mut, constraint = open_orders.owner == &user_account.key())]
    pub open_orders: AccountInfo<'info>,
    pub open_orders_owner: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    #[account(mut)]
    pub coin_vault: AccountInfo<'info>,
    /// The vault for the "quote" currency
    #[account(mut)]
    pub pc_vault: AccountInfo<'info>,

    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,

    #[account(mut, signer)]
    pub liquidator: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<LiquidatePosition>,
    max_coin_qty: u64,
    max_pc_qty: u64,
) -> ProgramResult {
    let liquidation_state = &mut ctx.accounts.liquidation_state;
    if liquidation_state.collected_positions.is_empty() {
        // If we're done liquidating positions, finish liquidation!
        msg!("Finished liquidation for user");
        ctx.accounts.user_account.is_in_liquidation = false;
        liquidation_state.liquidation_complete()
    } else {
        // If there are more positions in collected_positions, take the largest one, and liquidate it
        let (price, instrument_address) = liquidation_state.pop_largest_position();
        msg!(
            "Liquidating position at {}, with market value ${}",
            instrument_address,
            price
        );
        // Recalculate the spot
        let spot = get_serum_spot_price(
            &Market::load(
                &ctx.accounts.serum_market,
                &ctx.accounts.serum_dex_program_id.key(),
            )
            .unwrap(),
        );
        // Submit a serum order to sell the position
        let signer_seeds = &[
            PREFIX_USER_ACCOUNT.as_bytes(),
            ctx.accounts.exchange.key.as_ref(),
            ctx.accounts.user_account.owner.as_ref(),
            &[ctx.accounts.user_account.bump],
        ];
        return serum_new_order(
            &[signer_seeds],
            &ctx.accounts.serum_market,
            &ctx.accounts.open_orders,
            &ctx.accounts.request_queue,
            &ctx.accounts.event_queue,
            &ctx.accounts.bids,
            &ctx.accounts.asks,
            &ctx.accounts.liquidator,
            &ctx.accounts.open_orders_owner,
            &ctx.accounts.coin_vault,
            &ctx.accounts.pc_vault,
            &ctx.accounts.token_program,
            &ctx.accounts.rent.to_account_info(),
            &ctx.accounts.serum_dex_program_id,
            Side::Bid,
            spot as u64,
            max_coin_qty,
            OrderType::Limit,
            max_pc_qty,
            ctx.program_id,
            ctx.accounts.exchange.key,
        );
    }
    Ok(())
}
