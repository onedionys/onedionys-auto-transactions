import hre from 'hardhat';

export async function deployContract(contractName = '') {
    const [deployer] = await hre.ethers.getSigners();

    console.log('Deploying contracts with the account:', deployer.address);

    const Token = await hre.ethers.getContractFactory(contractName);
    const token = await Token.deploy(deployer.address);
    console.log(`Token deployed to: ${token.address}`);
}
