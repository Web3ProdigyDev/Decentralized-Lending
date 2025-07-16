use anchor_lang::prelude::*;

declare_id!("5vaMX6JR2rbZCCumirArFeVMsKajvtBa5vmcTsipQeWu");

#[program]
pub mod lending {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
