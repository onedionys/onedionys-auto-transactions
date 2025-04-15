import { ethers } from 'ethers';
import { getErrorMessage, getFormatDuration } from './utils.js';
import ora from 'ora';
import process from 'process';

const rpcNetworkUrl = process.env.RPC_URL;
const blockExplorerUrl = process.env.BLOCK_EXPLORER_URL;

const provider = new ethers.providers.JsonRpcProvider(rpcNetworkUrl);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const stTeaContractAddress = '0x04290DACdb061C6C9A0B9735556744be49A64012';
const stTeaContractData = '0x3d18b912';
const stTeaContractABI = [
    'function stake() payable',
    'function balanceOf(address owner) view returns (uint256)',
    'function withdraw(uint256 _amount)',
];
const stTeaInteraction = new ethers.Contract(stTeaContractAddress, stTeaContractABI, wallet);

const increaseGasPrice = async (multiplier = 2) => {
    if (!provider) return 0n;

    const feeData = await provider.getFeeData();
    if (!feeData.gasPrice) return 0n;

    let dynamicMultiplier = multiplier;
    const currentGasPriceGwei = Number(ethers.utils.formatUnits(feeData.gasPrice, 'gwei'));

    if (currentGasPriceGwei < 10) dynamicMultiplier = 3;
    else if (currentGasPriceGwei < 50) dynamicMultiplier = 2;
    else dynamicMultiplier = 1.5;

    const multiplierBigInt = BigInt(Math.round(dynamicMultiplier * 10));
    const gasPriceBigInt = BigInt(feeData.gasPrice.toString());
    const increasedGasPrice = (gasPriceBigInt * multiplierBigInt) / 10n;

    return increasedGasPrice;
};

const getTransactionOptions = async ({ estimateFn, transactionParams = {} }) => {
    const gasPriceTransaction = await increaseGasPrice();
    const estimatedGasTransaction = await estimateFn(transactionParams);
    const gasLimitTransaction = (BigInt(estimatedGasTransaction.toString()) * 120n) / 100n;

    console.log(`Gas Price: ${gasPriceTransaction}`);
    console.log(`Gas Limit: ${gasLimitTransaction}`);

    return gasPriceTransaction === 0n
        ? { ...transactionParams, gasLimitTransaction }
        : { ...transactionParams, gasLimitTransaction, gasPriceTransaction };
};

const userBalance = async () => {
    const teaBalance = await provider.getBalance(wallet.address);
    const teaBalanceFormat = parseFloat(ethers.utils.formatEther(teaBalance));

    if (teaBalanceFormat < 2) {
        console.log('Must have at least 2 TEA balances');
        process.exit(1);
    }

    const stTeaBalance = await stTeaInteraction.balanceOf(wallet.address).catch(() => ethers.BigNumber.from(0));
    const stTeaBalanceFormat = parseFloat(ethers.utils.formatEther(stTeaBalance));

    console.log(`Your Address: ${wallet.address}`);
    console.log(`Tea Balance: ${teaBalanceFormat}`);
    console.log(`stTea Balance: ${stTeaBalanceFormat}`);
};

export async function teaTransfer(wallets, amountTea = 0) {
    let spinner;

    try {
        await userBalance();

        const randomIndex = Math.floor(Math.random() * wallets.length);
        const walletSelected = wallets[randomIndex];

        const startTime = Date.now();
        const amount = ethers.utils.parseUnits(amountTea.toString(), 18);

        spinner = ora('Checking the gas price...').start();

        const txOptionsTransaction = await getTransactionOptions({
            estimateFn: wallet.estimateGas,
            txParams: { to: walletSelected.address, value: amount },
        });

        console.log(`Amount: ${ethers.utils.formatUnits(amount, 18)}`);

        spinner.text = 'Sending Transactions...';

        const transaction = await wallet.sendTransaction(txOptionsTransaction);
        const receipt = await transaction.wait();

        spinner.stop();

        console.log(' ');
        console.log(`To Address: ${walletSelected.address}`);
        console.log(`Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);

        const endTime = Date.now();
        const elapsedTime = getFormatDuration(endTime - startTime);

        console.log(`Successful transaction on block: ${receipt.blockNumber}`);
        console.log(`Execution time: ${elapsedTime}`);
    } catch (error) {
        if (spinner) spinner.stop();
        console.error(`Failed to transfer: ${getErrorMessage(error)}`);
    }
}

export async function stTeaStake(amountTea = 0) {
    let spinner;

    try {
        await userBalance();

        const startTime = Date.now();
        const amount = ethers.utils.parseUnits(amountTea.toString(), 18);

        spinner = ora('Checking the gas price...').start();

        const txOptionsTransaction = await getTransactionOptions({
            estimateFn: stTeaInteraction.estimateGas.stake,
            txParams: { value: amount },
        });

        console.log(`Amount: ${ethers.utils.formatUnits(amount, 18)}`);

        spinner.text = 'Sending Transactions...';

        const transaction = await stTeaInteraction.stake(txOptionsTransaction);
        const receipt = await transaction.wait();

        spinner.stop();

        console.log(' ');
        console.log(`Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);

        const endTime = Date.now();
        const elapsedTime = getFormatDuration(endTime - startTime);

        console.log(`Successful transaction on block: ${receipt.blockNumber}`);
        console.log(`Execution time: ${elapsedTime}`);
    } catch (error) {
        if (spinner) spinner.stop();
        console.error(`Failed to stake: ${getErrorMessage(error)}`);
    }
}

export async function stTeaWithdraw(amountTea = 0) {
    let spinner;

    try {
        await userBalance();

        const startTime = Date.now();
        const amount = ethers.utils.parseUnits(amountTea.toString(), 18);

        spinner = ora('Checking the gas price...').start();

        const txOptionsTransaction = await getTransactionOptions({
            estimateFn: stTeaInteraction.estimateGas.withdraw,
            txParams: amount,
        });

        console.log(`Amount: ${ethers.utils.formatUnits(amount, 18)}`);

        spinner.text = 'Sending Transactions...';

        const transaction = await stTeaInteraction.withdraw(amount, txOptionsTransaction);
        const receipt = await transaction.wait();

        spinner.stop();

        console.log(' ');
        console.log(`Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);

        const endTime = Date.now();
        const elapsedTime = getFormatDuration(endTime - startTime);

        console.log(`Successful transaction on block: ${receipt.blockNumber}`);
        console.log(`Execution time: ${elapsedTime}`);
    } catch (error) {
        if (spinner) spinner.stop();
        console.error(`Failed to withdraw: ${getErrorMessage(error)}`);
    }
}

export async function stTeaClaimReward() {
    let spinner;

    try {
        await userBalance();

        const startTime = Date.now();

        spinner = ora('Checking the gas price...').start();

        const txOptionsTransaction = await getTransactionOptions({
            estimateFn: wallet.estimateGas,
            txParams: { to: stTeaContractAddress, data: stTeaContractData },
        });

        spinner.text = 'Sending Transactions...';

        const transaction = await wallet.sendTransaction(txOptionsTransaction);
        const receipt = await transaction.wait();

        spinner.stop();

        console.log(' ');
        console.log(`Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);

        const endTime = Date.now();
        const elapsedTime = getFormatDuration(endTime - startTime);

        console.log(`Successful transaction on block: ${receipt.blockNumber}`);
        console.log(`Execution time: ${elapsedTime}`);
    } catch (error) {
        if (spinner) spinner.stop();
        console.error(`Failed to claim reward: ${getErrorMessage(error)}`);
    }
}
