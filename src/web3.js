import { ethers } from 'ethers';
import process from 'process';

const rpcNetworkUrl = process.env.RPC_URL;
const stTeaContractABI = [
    'function stake() payable',
    'function balanceOf(address owner) view returns (uint256)',
    'function withdraw(uint256 _amount)',
];

export const blockExplorerUrl = process.env.BLOCK_EXPLORER_URL;
export const provider = new ethers.providers.JsonRpcProvider(rpcNetworkUrl);
export const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
export const stTeaContractAddress = '0x04290DACdb061C6C9A0B9735556744be49A64012';
export const stTeaContractData = '0x3d18b912';
export const stTeaInteraction = new ethers.Contract(stTeaContractAddress, stTeaContractABI, wallet);

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

export async function getTransactionOptions({ estimateFn, transactionParams = {} }) {
    const gasPriceTransaction = await increaseGasPrice();
    const estimatedGasTransaction = await estimateFn(transactionParams);
    const gasLimitTransaction = (BigInt(estimatedGasTransaction.toString()) * 120n) / 100n;

    console.log(`Gas Price: ${gasPriceTransaction}`);
    console.log(`Gas Limit: ${gasLimitTransaction}`);

    return gasPriceTransaction === 0n
        ? { ...transactionParams, gasLimitTransaction }
        : { ...transactionParams, gasLimitTransaction, gasPriceTransaction };
}

export async function userBalance() {
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
}
