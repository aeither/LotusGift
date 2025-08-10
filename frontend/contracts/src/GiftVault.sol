// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GiftVault {
    address public owner;
    struct Gift {
        address sender;
        address receiver;
        uint256 amount; // in wei (ETH)
        string message;
        string category; // e.g., birthday, celebration
        bool hasClaimed;
        uint256 timestamp;
    }

    uint256 public nextGiftId;
    mapping(uint256 => Gift) public gifts;

    event GiftCreated(uint256 indexed giftId, address indexed sender, address indexed receiver, uint256 amount, string message, string category);
    event GiftClaimed(uint256 indexed giftId, address indexed receiver, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createGift(address receiver, string calldata message, string calldata category) external payable returns (uint256 giftId) {
        require(receiver != address(0), "invalid receiver");
        require(msg.value > 0, "amount required");

        giftId = nextGiftId++;
        gifts[giftId] = Gift({
            sender: msg.sender,
            receiver: receiver,
            amount: msg.value,
            message: message,
            category: category,
            hasClaimed: false,
            timestamp: block.timestamp
        });

        emit GiftCreated(giftId, msg.sender, receiver, msg.value, message, category);
    }

    function claimGift(uint256 giftId) external {
        Gift storage g = gifts[giftId];
        require(g.receiver != address(0), "gift not found");
        require(msg.sender == g.receiver, "not receiver");
        require(!g.hasClaimed, "already claimed");
        uint256 amount = g.amount;
        g.hasClaimed = true;
        g.amount = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        emit GiftClaimed(giftId, msg.sender, amount);
    }

    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "invalid to");
        uint256 amount = address(this).balance;
        require(amount > 0, "no funds");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "withdraw failed");
        emit Withdrawn(to, amount);
    }
}

