import process from 'process';
import fs from 'fs';
import path from 'path';

export function getErrorMessage(error) {
    let errorMessage = 'An unknown error occurred';

    if (error?.error?.reason) {
        let reason = error.error.reason;
        reason = reason.split(': ').pop();
        errorMessage = `${error.error.code} - ${reason}`;
    } else {
        if (error?.code) {
            switch (error.code) {
                case 'NETWORK_ERROR':
                    errorMessage = 'Network error - The blockchain network may have changed or is unreachable.';
                    break;
                case 'SERVER_ERROR':
                    errorMessage = 'Server error - The RPC provider may be down.';
                    break;
                case 'CALL_EXCEPTION':
                    errorMessage = 'Call exception - A smart contract call failed.';
                    break;
                case 'NUMERIC_FAULT':
                    errorMessage = 'Numeric fault - Invalid number format or overflow.';
                    break;
                case 'INSUFFICIENT_FUNDS':
                    errorMessage = 'Insufficient funds - You need more ETH for gas fees.';
                    break;
                case 'UNPREDICTABLE_GAS_LIMIT':
                    errorMessage = 'Gas estimation failed - Try increasing gas limit.';
                    break;
                default:
                    errorMessage = `Error (${error.code}) - ${error.reason || error.message}`;
            }
        } else if (error?.message) {
            errorMessage = `${error.message}`;
        }
    }

    return errorMessage;
}

export function getJsonABI(toPath = '') {
    const cwd = process.cwd();
    const filePath = path.resolve(cwd, `artifacts/contracts/${toPath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    return JSON.parse(fileContent);
}
