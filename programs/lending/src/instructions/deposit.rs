use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::state::{Bank, User};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [mint.key().as_ref()],
        bump,
    )]
    pub bank: Account<'info, Bank>,

    #[account(
        mut,
        seeds = [b"treasury", mint.key().as_ref()],
        bump,
    )]
    pub bank_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [signer.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, User>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program,
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn process_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let transfer_cpi_accounts = TransferChecked {
        from : ctx.accounts.user_token_account.to_account_info(),
        to : ctx.accounts.bank_token_account.to_account_info(),
        authority : ctx.accounts.signer.to_account_info(),
        mint : ctx.accounts.mint.to_account_info(),
    };

    let cpi_program = AccountInfo<'_> = ctx.accounts.token_program.to_account_info();
    let cpi_ctx: CpiContext<'_, '_, '_, '_, _>  = CpiContext::new(cpi_program, transfer_cpi_accounts);

    let decimals = ctx.accounts.mint.decimals;

    token_interface::transfer_checked(
        cpi_ctx, amount, decimals)?;
    let bank: &mut Account<'_, Bank> = &mut ctx.accounts.bank;

    if bank.total_deposits == 0 {
        bank.total_deposits = amount;
        bank.total_deposited_shares = amount;
    }

    let deposit_ratio: u64 = amount.checked_div(bank.total_deposits).unwrap();
    let user_shares = bank.total_deposited_shares.checked_mul(deposit_ratio).unwrap();

    let user: &mut Account<'_, User> = &mut ctx.accounts.user_account;

    match ctx.accounts.mint.to_account_info().key() {
        key: Pubkey if key == user.user_usdc_address => {
            user.deposited_usdc += amount;
            user.deposited_usdc_shares += user_shares;
        },
        _ => {
            user.deposited_sol += amount;
            user.deposited_sol_shares += user_shares;
        }
    }

    bank.total_deposits += amount;
    bank.total_deposited_shares += user_shares;

    Ok(())
}