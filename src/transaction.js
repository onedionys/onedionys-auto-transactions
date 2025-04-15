import { ethers } from 'ethers';
import { getErrorMessage, getFormatDuration, getJsonABI, getRandomNumber } from './utils.js';
import { blockExplorerUrl, getTransactionOptions, userBalance, wallet } from './web3.js';
import ora from 'ora';

export async function sendTransaction(wallets, tokenContractAddress = '', tokenContractName = '') {
    let spinner;

    try {
        await userBalance();

        wallets.unshift({ address: tokenContractAddress });

        let walletSelected;
        let random = Math.random();

        if (random < 0.4) {
            walletSelected = wallets[0];
        } else {
            const remainingWallets = wallets.slice(1);
            walletSelected = remainingWallets[Math.floor(Math.random() * remainingWallets.length)];
        }

        const contractAddress = walletSelected.address;
        const contractJson = getJsonABI(`${tokenContractName}.sol/${tokenContractName}.json`);
        const contractAbi = contractJson.abi;
        const contractInteraction = new ethers.Contract(contractAddress, contractAbi, wallet);

        const listFunctions = ['transfer', 'smallTransfer', 'mint', 'burn', 'approve', 'stake', 'unstake'];
        const functionSelected = listFunctions[Math.floor(Math.random() * listFunctions.length)];
        const needValue = !['mint', 'burn', 'approve'].includes(functionSelected);

        const startTime = Date.now();
        const amount = ethers.utils.parseUnits(getRandomNumber(0.00001, 0.0001).toFixed(5), 18);

        spinner = ora('Checking the gas price...').start();

        const estimateOptions = needValue ? { value: amount } : {};
        const txOptionsTransaction = await getTransactionOptions({
            estimateFn: contractInteraction.estimateGas[functionSelected],
            transactionParams: estimateOptions,
        });

        console.log(`Function: ${functionSelected}`);
        console.log(`Amount: ${needValue ? ethers.utils.formatUnits(amount, 18) : '0.0'}`);

        spinner.text = 'Sending Transactions...';

        const transaction = await contractInteraction[functionSelected](txOptionsTransaction);
        const receipt = await transaction.wait();

        spinner.stop();

        console.log(' ');
        if (tokenContractAddress === contractAddress) {
            console.log(`To Address: ${tokenContractAddress} (${tokenContractName})`);
        } else {
            console.log(`To Address: ${tokenContractAddress}`);
        }
        console.log(`Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);

        const endTime = Date.now();
        const elapsedTime = getFormatDuration(endTime - startTime);

        console.log(`Successful transaction on block: ${receipt.blockNumber}`);
        console.log(`Execution time: ${elapsedTime}`);
    } catch (error) {
        if (spinner) spinner.stop();
        console.error(`Failed to send transaction: ${getErrorMessage(error)}`);
    }
}
