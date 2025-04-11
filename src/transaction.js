import { ethers } from 'ethers';
import { getErrorMessage, getFormatDuration, getJsonABI, getRandomNumber } from './utils.js';
import delay from 'delay';
import { deployContract, isContractDeployed } from './deploy.js';
import fs from 'fs';
import ora from 'ora';
import path from 'path';
import process from 'process';
import prompts from 'prompts';
import pkg from 'hardhat';
const { run } = pkg;

const rpcNetworkUrl = process.env.RPC_URL;
const blockExplorerUrl = process.env.BLOCK_EXPLORER_URL;

const provider = new ethers.providers.JsonRpcProvider(rpcNetworkUrl);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const arrListCreateExisting = [
    {
        id: 'Existing',
        name: 'Existing Contract',
    },
    {
        id: 'Create',
        name: 'Create New Contract',
    },
];

const arrListTransactions = [
    {
        id: 'Limit',
        name: 'Limit Transactions',
    },
    {
        id: 'Unlimited',
        name: 'Unlimited Transactions',
    },
];

const arrListDelay = [
    {
        id: 'Manual',
        name: 'Manual Delay',
    },
    {
        id: 'Automatic',
        name: 'Automatic Delay',
    },
    {
        id: 'Without',
        name: 'Without Delay',
    },
];

const onCancel = () => {
    console.log(' ');
    console.log('=======================================================');
    console.log(' ');
    console.log('Ongoing process has been canceled');
    console.log(' ');
    console.log('=======================================================');
    console.log(' ');
    process.exit(1);
};

const isArtifactExists = async (contractName = '') => {
    const artifactPath = path.resolve(`artifacts/contracts/${contractName}.sol/${contractName}.json`);
    return fs.existsSync(artifactPath);
};

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

export const sendTransaction = async (wallets, tokenContractAddress = '', tokenContractName = '') => {
    let spinner1, spinner2;

    try {
        wallets.unshift({ address: tokenContractAddress });

        let walletSelected;

        const random = Math.random();

        if (random < 0.6) {
            walletSelected = wallets[0];
        } else {
            const remainingWallets = wallets.slice(1);
            const randomIndex = Math.floor(Math.random() * remainingWallets.length);
            walletSelected = remainingWallets[randomIndex];
        }

        const contractAddress = walletSelected.address;
        const contractJson = getJsonABI(`${tokenContractName}.sol/${tokenContractName}.json`);
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
        if (spinner1) spinner1.stop();
        if (spinner2) spinner2.stop();
        console.error(`Failed to send transaction: ${getErrorMessage(error)}`);
    }
};

async function mainInteraction() {
    const wallets = fs.existsSync('assets/json/wallets.json')
        ? JSON.parse(fs.readFileSync('assets/json/wallets.json', 'utf-8'))
        : [];
    const contracts = fs.existsSync('assets/json/contracts.json')
        ? JSON.parse(fs.readFileSync('assets/json/contracts.json', 'utf-8'))
        : [];

    let chooseListCreateExistingName = '';
    let chooseListCreateExistingId = '';
    let arrListCreateExistingPrompts = [];

    let chooseListTransactionsName = '';
    let chooseListTransactionsId = '';
    let arrListTransactionsPrompts = [];

    let chooseListDelayName = '';
    let chooseListDelayId = '';
    let arrListDelayPrompts = [];

    arrListCreateExisting.forEach((row) => {
        arrListCreateExistingPrompts.push({
            title: row.name,
            value: row.id,
        });
    });

    arrListTransactions.forEach((row) => {
        arrListTransactionsPrompts.push({
            title: row.name,
            value: row.id,
        });
    });

    arrListDelay.forEach((row) => {
        arrListDelayPrompts.push({
            title: row.name,
            value: row.id,
        });
    });

    const { getListCreateExisting } = await prompts(
        {
            type: 'select',
            name: 'getListCreateExisting',
            message: 'Choose existing contract or create a new one',
            choices: arrListCreateExistingPrompts,
        },
        { onCancel },
    );

    const getListCreateExistingExists = arrListCreateExisting.some((prompt) => prompt.id === getListCreateExisting);

    if (getListCreateExistingExists) {
        const listListCreateExisting = arrListCreateExisting.find((prompt) => prompt.id === getListCreateExisting);
        chooseListCreateExistingName = listListCreateExisting.name;
        chooseListCreateExistingId = listListCreateExisting.id;

        let tokenContractName = '';
        let tokenContractAddress = '';
        let isDeployContract = false;

        if (chooseListCreateExistingId === 'Existing') {
            if (contracts.length > 0) {
                const arrListContracts = contracts.map((contract) => ({
                    id: contract.address,
                    name: contract.name,
                }));

                let chooseListContractsName = '';
                let chooseListContractsId = '';
                let arrListContractsPrompts = [];

                arrListContracts.forEach((row) => {
                    arrListContractsPrompts.push({
                        title: row.name,
                        value: row.id,
                    });
                });

                const { getListContracts } = await prompts(
                    {
                        type: 'select',
                        name: 'getListContracts',
                        message: 'Choose the contract you want to use',
                        choices: arrListContractsPrompts,
                    },
                    { onCancel },
                );

                const getListContractsExists = arrListContracts.some((prompt) => prompt.id === getListContracts);

                if (getListContractsExists) {
                    const listListContracts = arrListContracts.find((prompt) => prompt.id === getListContracts);
                    chooseListContractsName = listListContracts.name;
                    chooseListContractsId = listListContracts.id;
                    const spinner1 = ora('Checking contracts have been deployed...').start();
                    const deployed = await isContractDeployed(chooseListContractsId);
                    spinner1.stop();

                    if (deployed && isArtifactExists(chooseListContractsName)) {
                        tokenContractName = chooseListContractsName;
                        tokenContractAddress = chooseListContractsId;
                        isDeployContract = false;
                    } else {
                        tokenContractName = chooseListContractsName;
                        isDeployContract = true;
                    }
                } else {
                    console.log(' ');
                    console.log('=======================================================');
                    console.log(' ');
                    console.log('The selected contract does not exist');
                    console.log(' ');
                    console.log('=======================================================');
                    console.log(' ');
                    process.exit(1);
                }
            } else {
                console.log(' ');
                console.log('=======================================================');
                console.log(' ');
                console.log('No contract list available');
                console.log(' ');
                console.log('=======================================================');
                console.log(' ');
                process.exit(1);
            }
        } else {
            const { contractName } = await prompts(
                {
                    type: 'text',
                    name: 'contractName',
                    message: 'Enter contract name',
                    validate: (value) => (value.trim() === '' ? 'Contract name is required' : true),
                },
                { onCancel },
            );

            const trimmedName = contractName.trim();
            const isDuplicate = contracts.some((contract) => contract.name.toLowerCase() === trimmedName.toLowerCase());

            if (isDuplicate) {
                console.log(' ');
                console.log('=======================================================');
                console.log(' ');
                console.log(`Contract name "${trimmedName}" already exists in contracts.json`);
                console.log(' ');
                console.log('=======================================================');
                console.log(' ');
                process.exit(1);
            } else {
                tokenContractName = trimmedName;
                isDeployContract = true;
            }
        }

        const { getListTransactions } = await prompts(
            {
                type: 'select',
                name: 'getListTransactions',
                message: 'Choose the transaction you want to use',
                choices: arrListTransactionsPrompts,
            },
            { onCancel },
        );

        const getListTransactionsExists = arrListTransactions.some((prompt) => prompt.id === getListTransactions);

        if (getListTransactionsExists) {
            const listListTransactions = arrListTransactions.find((prompt) => prompt.id === getListTransactions);
            chooseListTransactionsName = listListTransactions.name;
            chooseListTransactionsId = listListTransactions.id;

            let amountTransactions = 0;

            if (chooseListTransactionsId === 'Limit') {
                const responseLimit = await prompts(
                    {
                        type: 'text',
                        name: 'manualLimit',
                        message: 'Enter how many transactions you want',
                        validate: (value) => {
                            const trimmedValue = value.trim();
                            if (trimmedValue === '') {
                                return 'How many transactions is required';
                            }
                            if (isNaN(trimmedValue)) {
                                return 'Please enter a valid number';
                            }
                            const intValue = parseInt(trimmedValue);
                            if (intValue <= 0) {
                                return 'At least more than one';
                            }
                            return true;
                        },
                    },
                    { onCancel },
                );

                const manualLimit = parseInt(responseLimit.manualLimit);
                if (!isNaN(manualLimit)) {
                    amountTransactions = manualLimit;
                }
            }

            const { getListDelay } = await prompts(
                {
                    type: 'select',
                    name: 'getListDelay',
                    message: 'Choose the delay you want to use',
                    choices: arrListDelayPrompts,
                },
                { onCancel },
            );

            const getListDelayExists = arrListDelay.some((prompt) => prompt.id === getListDelay);

            if (getListDelayExists) {
                const listListDelay = arrListDelay.find((prompt) => prompt.id === getListDelay);
                chooseListDelayName = listListDelay.name;
                chooseListDelayId = listListDelay.id;

                let randomDelay = 0;

                if (chooseListDelayId === 'Manual') {
                    const response = await prompts(
                        {
                            type: 'text',
                            name: 'manualDelay',
                            message: 'Enter how many delay (1000 = 1 seconds)',
                            validate: (value) => {
                                const trimmedValue = value.trim();
                                if (trimmedValue === '') {
                                    return 'How many delay is required';
                                }
                                if (isNaN(trimmedValue)) {
                                    return 'Please enter a valid number';
                                }
                                const intValue = parseInt(trimmedValue);
                                if (intValue <= 0) {
                                    return 'At least more than one';
                                }
                                return true;
                            },
                        },
                        { onCancel },
                    );

                    const manualDelay = parseInt(response.manualDelay);
                    if (!isNaN(manualDelay)) {
                        randomDelay = manualDelay;
                    }
                }

                console.log(' ');
                console.log('=======================================================');
                console.log(' ');

                if (isDeployContract) {
                    let baseContent = fs.readFileSync('templates/Base.sol', 'utf-8');
                    baseContent = baseContent.replace(/\bcontract\s+Base\b/, `contract ${tokenContractName}`);

                    fs.writeFileSync(`contracts/${tokenContractName}.sol`, baseContent);
                    console.log(`Created new contract file: contracts/${tokenContractName}.sol`);

                    const originalConsoleLog = console.log;
                    console.log = () => {};

                    await run('compile');

                    console.log = originalConsoleLog;

                    const address = await deployContract(tokenContractName);
                    tokenContractAddress = address;

                    contracts.push({
                        name: tokenContractName,
                        address,
                    });

                    fs.writeFileSync('assets/json/contracts.json', JSON.stringify(contracts, null, 4));
                    console.log('Contract deployed & saved successfully!');
                }

                console.log(`Loaded ${wallets.length} wallets.`);
                console.log('Starting continuous interactions...');
                console.log(' ');
                console.log('=======================================================');
                console.log(' ');

                if (chooseListTransactionsId === 'Limit') {
                    for (let iteration = 1; iteration <= amountTransactions; iteration++) {
                        console.log(`Iteration: ${iteration}`);
                        console.log(`Current Time: ${new Date().toString()}`);
                        console.log(`Type: ${chooseListCreateExistingName}`);
                        console.log(`Transaction: ${chooseListTransactionsName}`);
                        console.log(`Delay: ${chooseListDelayName}`);
                        console.log(' ');
                        await sendTransaction(wallets, tokenContractAddress, tokenContractName);
                        console.log(' ');
                        console.log('=======================================================');
                        console.log(' ');

                        if (chooseListDelayId === 'Manual') {
                            const spinner1 = ora('Loading...').start();
                            await delay(randomDelay);
                            spinner1.stop();
                        } else if (chooseListDelayId === 'Automatic') {
                            const spinner1 = ora('Loading...').start();
                            await delay(Math.floor(Math.random() * (15000 - 4000 + 1)) + 4000);
                            spinner1.stop();
                        }
                    }
                } else {
                    let iteration = 1;
                    while (true) {
                        console.log(`Iteration: ${iteration}`);
                        console.log(`Current Time: ${new Date().toString()}`);
                        console.log(`Type: ${chooseListCreateExistingName}`);
                        console.log(`Transaction: ${chooseListTransactionsName}`);
                        console.log(`Delay: ${chooseListDelayName}`);
                        console.log(' ');
                        await sendTransaction(wallets, tokenContractAddress, tokenContractName);
                        console.log(' ');
                        console.log('=======================================================');
                        console.log(' ');
                        iteration++;

                        if (chooseListDelayId === 'Manual') {
                            const spinner1 = ora('Loading...').start();
                            await delay(randomDelay);
                            spinner1.stop();
                        } else if (chooseListDelayId === 'Automatic') {
                            const spinner1 = ora('Loading...').start();
                            await delay(Math.floor(Math.random() * (15000 - 4000 + 1)) + 4000);
                            spinner1.stop();
                        }
                    }
                }
            } else {
                console.log(' ');
                console.log('=======================================================');
                console.log(' ');
                console.log('Delay option not found');
                console.log(' ');
                console.log('=======================================================');
                console.log(' ');
                process.exit(1);
            }
        } else {
            console.log(' ');
            console.log('=======================================================');
            console.log(' ');
            console.log('Transaction option not found');
            console.log(' ');
            console.log('=======================================================');
            console.log(' ');
            process.exit(1);
        }
    } else {
        console.log(' ');
        console.log('=======================================================');
        console.log(' ');
        console.log('No existing or new options found');
        console.log(' ');
        console.log('=======================================================');
        console.log(' ');
        process.exit(1);
    }
}

mainInteraction();
