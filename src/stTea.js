import { ethers } from 'ethers';
import { getErrorMessage, getFormatDuration } from './utils.js';
import {
    blockExplorerUrl,
    getTransactionOptions,
    stTeaContractAddress,
    stTeaContractData,
    stTeaInteraction,
    userBalance,
    wallet,
} from './web3.js';
import ora from 'ora';

export async function teaTransfer(wallets, amountTea = 0) {
    let spinner;

    try {
        await userBalance();

        const randomIndex = Math.floor(Math.random() * wallets.length);
        const walletSelected = wallets[randomIndex];

        const startTime = Date.now();
        const amount = ethers.utils.parseUnits(amountTea.toString(), 18);

        const txOptionsTransaction = await getTransactionOptions({
            estimateFn: wallet.estimateGas,
            transactionParams: { to: walletSelected.address, value: amount },
        });

        console.log(`Amount: ${ethers.utils.formatUnits(amount, 18)}`);

        spinner = ora('Sending Transactions...').start();

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

        const txOptionsTransaction = await getTransactionOptions({
            estimateFn: stTeaInteraction.estimateGas.stake,
            transactionParams: { value: amount },
        });

        console.log(`Amount: ${ethers.utils.formatUnits(amount, 18)}`);

        spinner = ora('Sending Transactions...').start();

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

        const txOptionsTransaction = await getTransactionOptions({
            estimateFn: stTeaInteraction.estimateGas.withdraw,
            transactionParams: amount,
        });

        console.log(`Amount: ${ethers.utils.formatUnits(amount, 18)}`);

        spinner = ora('Sending Transactions...').start();

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

        const txOptionsTransaction = await getTransactionOptions({
            estimateFn: wallet.estimateGas,
            transactionParams: { to: stTeaContractAddress, data: stTeaContractData },
        });

        spinner = ora('Sending Transactions...').start();

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
