import { describe, it } from 'node:test';
import IDL from '../target/idl/lending.json';
import { Lending } from '../target/types/lending';
import { BanksClient, ProgramTestContext, startAnchor } from 'solana-bankrun';
import { Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BankrunProvider } from 'anchor-bankrun';
import { PythSolanaReceiver } from '@pythnetwork/pyth-solana-receiver';
import { BankrunContextWrapper } from '../bankrun-utils/bankrunConnection';
import { createMint } from '@solana/spl-token';

describe("Lending Smart Contract Test", async () => {
    let context: ProgramTestContext;
    let provider: BankrunProvider;
    let BankrunContextWrapper: BankrunContextWrapper;
    let program: Program<Lending>;
    let banksClient: BanksClient;
    let signer: Keypair;
    let usdcBankAccount: PublicKey;
    let solBankAccount: PublicKey;

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

    const connection = BankrunContextWrapper.connection.toConnection();

    {const pythSolanaReceiver = new PythSolanaReceiver({
        connection,
        wallet: provider.wallet,
    });
    const solUsdPriceFeedAccount = pythSolanaReceiver.getPriceFeedAccountAddress(
        0, 
        SOL_PRICE_FEED_ID
    );
    const feedAccountInfo = await devnetConnection.getAccountInfo(
        solUsdPriceFeedAccount
    );

    context.setAccount(solUsdPriceFeedAccount, feedAccountInfo);
    program = new Program<Lending>( IDL as Lending, provider);

    banksClient = context.banksClient;
    signer = provider.wallet.payer;

    const mintUSDC = await createMint(
        banksClient,
        signer, 
        signer.publicKey, 
        null,
        2
    );

    const mintSol = await createMint(
        banksClient,
        signer, 
        signer.publicKey, 
        null,
        2
    );

    [usdcBankAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury", mintUSDC.toBuffer())],
        program.programId
    );

    [solBankAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury", mintSol.toBuffer())],
        program.programId
    );

});

