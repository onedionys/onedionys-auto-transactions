import { ethers } from 'ethers';
import { getErrorMessage, getFormatDuration, getJsonABI, getOnCancel, getRandomNumber } from './utils.js';
import delay from 'delay';
import fs from 'fs';
import ora from 'ora';
import process from 'process';
import prompts from 'prompts';

void (prompts, getOnCancel);

const rpcNetworkUrl = process.env.RPC_URL;
const blockExplorerUrl = process.env.BLOCK_EXPLORER_URL;

const provider = new ethers.providers.JsonRpcProvider(rpcNetworkUrl);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

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

const sendTransaction = async (wallets) => {
    let spinner1, spinner2;

    try {
        let walletSelected;

        const random = Math.random();

        if (random < 0.5) {
            walletSelected = wallets[0];
        } else {
            const remainingWallets = wallets.slice(1);
            const randomIndex = Math.floor(Math.random() * remainingWallets.length);
            walletSelected = remainingWallets[randomIndex];
        }

        const contractAddress = walletSelected.address;
        const contractJson = getJsonABI('TeaDAO.sol/TeaDAO.json');
        const contractAbi = contractJson.abi;
        const contractInteraction = new ethers.Contract(contractAddress, contractAbi, wallet);

        const listFunctions = ['transfer', 'smallTransfer', 'mint', 'burn', 'approve', 'stake', 'unstake'];
        const functionSelected = listFunctions[Math.floor(Math.random() * listFunctions.length)];

        const startTime = Date.now();
        const amount = ethers.utils.parseUnits(getRandomNumber(0.00001, 0.0001).toFixed(5), 18);

        spinner1 = ora('Checking the gas price...').start();

        const gasPriceTransaction = await increaseGasPrice();

        const needValue = !['mint', 'burn', 'approve'].includes(functionSelected);

        const estimateOptions = needValue ? { value: amount } : {};
        const estimatedGasTransaction = await contractInteraction.estimateGas[functionSelected](estimateOptions);
        const gasLimitTransaction = (BigInt(estimatedGasTransaction.toString()) * 120n) / 100n;

        const txOptionsTransaction =
            gasPriceTransaction === 0n
                ? needValue
                    ? { gasLimit: gasLimitTransaction, value: amount }
                    : { gasLimit: gasLimitTransaction }
                : needValue
                  ? { gasLimit: gasLimitTransaction, gasPrice: gasPriceTransaction, value: amount }
                  : { gasLimit: gasLimitTransaction, gasPrice: gasPriceTransaction };

        spinner1.stop();

        console.log(`Function: ${functionSelected}`);
        console.log(`Gas Price: ${gasPriceTransaction}`);
        console.log(`Gas Limit: ${gasLimitTransaction}`);
        console.log(`Amount: ${needValue ? ethers.utils.formatUnits(amount, 18) : '0.0'}`);

        spinner2 = ora('Sending Transactions...').start();

        const transaction = await contractInteraction[functionSelected](txOptionsTransaction);
        const receipt = await transaction.wait();

        spinner2.stop();

        console.log(`Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);

        const endTime = Date.now();
        const elapsedTime = getFormatDuration(endTime - startTime);

        console.log(`Successful transaction on block: ${receipt.blockNumber}`);
        console.log(`Execution time: ${elapsedTime}`);
    } catch (error) {
        if (spinner1) spinner1.stop();
        if (spinner2) spinner2.stop();
        console.error(`Failed to send transaction: ${getErrorMessage(error)}`);
    }
};

export async function mainInteraction() {
    const wallets = JSON.parse(fs.readFileSync('wallets.json'));
    console.log(' ');
    console.log('=======================================================');
    console.log(' ');
    console.log(`Loaded ${wallets.length} wallets.`);
    console.log('Starting continuous interactions...');
    console.log(' ');
    console.log('=======================================================');
    console.log(' ');

    let iteration = 1;
    while (true) {
        console.log(`Iteration: ${iteration}`);
        console.log(`Current Time: ${new Date().toString()}`);
        console.log(' ');
        await sendTransaction(wallets);
        console.log(' ');
        console.log('=======================================================');
        console.log(' ');
        iteration++;
        await delay(Math.floor(Math.random() * (15000 - 4000 + 1)) + 4000);
    }
}

// mainInteraction();
