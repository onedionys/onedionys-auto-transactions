import hre from 'hardhat';

export async function deployContract(contractName = '') {
    const [deployer] = await hre.ethers.getSigners();

    console.log('Deploying contracts with the account:', deployer.address);

    const Contract = await hre.ethers.getContractFactory(contractName);
    const contract = await Contract.deploy(deployer.address);
    console.log(`Contract deployed to: ${contract.address}`);
}
