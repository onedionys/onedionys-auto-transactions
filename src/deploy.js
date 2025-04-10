import hre from 'hardhat';
import process from 'process';

export async function deployContract(contractName = '') {
    const [deployer] = await hre.ethers.getSigners();
    console.log('Deploying contracts with the account:', deployer.address);

    const Factory = await hre.ethers.getContractFactory(contractName);
    const contract = await Factory.deploy(deployer.address);
    await contract.deployed();

    console.log(`Deployed ${contractName} at: ${contract.address}`);
    return contract.address;
}

export async function isContractDeployed(address = '') {
    const code = await hre.ethers.provider.getCode(address);
    return code !== '0x';
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const contractName = process.argv[2];
    if (!contractName) {
        console.error('Please provide contract name.');
        process.exit(1);
    }

    deployContract(contractName)
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
