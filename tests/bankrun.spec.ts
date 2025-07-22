import { describe, it } from 'node:test';
import IDL from '../target/idl/lending.json';
import { Lending } from '../target/types/lending';
import { ProgramTestContext, startAnchor } from 'solana-bankrun';
import { Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { BankrunProvider } from 'anchor-bankrun';
import { PythSolanaReceiver } from '@pythnetwork/pyth-solana-receiver';
import { BankrunContextWrapper } from '../bankrun-utils/bankrunConnection';
import { Context } from 'mocha';

describe("Lending Smart Contract Test", async () => {
    let context: ProgramTestContext;
    let provider: BankrunProvider;
    let BankrunContextWrapper: BankrunContextWrapper;

    const pyth = new PublicKey("Fw1ETanDZafof7xEULsnq9UY6o71Tpds89tNwPkWLb1v")

    const devnetConnection = new Connection("https://api.devnet.solana.com");
    const AccountInfo = await devnetConnection.getAccountInfo(pyth);
    
    context = await startAnchor(
        "", 
        [{name: "Lending", programId: new PublicKey(IDL.address) }],
    [{ address: pyth, info: AccountInfo }]
);
provider = new BankrunProvider(context);

const SOL_PRICE_FEED_ID = "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";

BankrunContextWrapper = new BankrunContextWrapper(context);

const pythSolanaReceiver = new PythSolanaReceiver();
});