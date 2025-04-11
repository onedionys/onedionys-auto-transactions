# Onedionys Auto Transactions

A lightweight and efficient tool designed to automate transactions across any network that supports RPC. Whether you're building a dApp, running backend services, or just want to streamline repetitive crypto tasks, this package offers a simple and flexible way to interact with RPC endpoints programmatically.

With full support for all RPC-compatible networks, this package lets you handle signing, sending, and tracking transactions in just a few lines of code - no matter what chain you're working with.

## Key Features

This tool is ideal for developers looking to save time, reduce boilerplate code, and build scalable blockchain applications with ease.

- Supports all RPC-compatible networks
- Easy-to-use interface for sending transactions
- Wallet and private key integration
- Promise-based and async/await friendly
- Minimal dependencies and high performance

## Prerequisites

### 1. Node.js

To run this bot, you need Node.js. You can download and install it from the official Node.js website.

- **Download**: [Node.js Official Website](https://nodejs.org/en)
- **Version**: The bot requires Node.js version 16 or higher
- **Verify**: Once you have Node.js installed, open your terminal or command prompt and check the version using the following commands:

    ```bash
    node -v
    npm -v
    ```

## Installation

- **Clone the Repository**: Get a copy of the project code on your local machine

    ```bash
    git clone https://github.com/onedionys/onedionys-auto-transactions.git
    cd onedionys-auto-transactions
    ```

- **Install Dependencies**: Install all required packages and dependencies

    ```bash
    npm install
    ```

- **Create a .env File**: Set up your environment variables by creating a .env file

    ```bash
    cp .env.example .env
    ```

- **Add Your Private Key & RPC**: Paste your Private Key & RPC configuration into the .env file

    - Open the .env file in a text editor
    - Replace the placeholder with your actual Private Key & RPC configuration

        ```env
        # Wallet Configuration
        PRIVATE_KEY="your_private_key_here"

        # Network Configuration
        RPC_URL="your_rpc_url_here"
        CHAIN_ID="your_chain_id_here"
        BLOCK_EXPLORER_URL="your_block_explorer_url_here"
        ```

## Usage

You can run the bot with the command below:

```bash
npm run autoTransaction
```

## Configuration

Make sure all configurations are set up correctly before running the scripts.

- **Required**:

    - **Private Key**: Your private key
    - **RPC URL**: RPC url according to what you want to run
    - **Chain ID**: Chain id as per network
    - **Block Explorer URL**: Corresponding explorer url

## Testing

The project includes basic tests for each feature using Mocha and Chai. To run tests, use the following command:

```bash
npm run test
```

## How to Contribute

Please check our [CONTRIBUTING.md](CONTRIBUTING.md) guide for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. Feel free to use and modify it for your own purposes.
