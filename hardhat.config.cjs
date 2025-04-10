require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

const process = require('process');

module.exports = {
    solidity: {
        version: '0.8.28',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        all: {
            url: process.env.RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
            chainId: Number(process.env.CHAIN_ID),
        },
    },
};
