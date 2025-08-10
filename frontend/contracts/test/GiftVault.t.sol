// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {GiftVault} from "../src/GiftVault.sol";

contract GiftVaultTest is Test {
    GiftVault vault;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address admin = address(this);

    function setUp() public {
        vault = new GiftVault();
        vm.deal(alice, 10 ether);
    }

    function test_CreateAndClaim() public {
        vm.startPrank(alice);
        uint256 giftId = vault.createGift{value: 1 ether}(bob, "Happy birthday!", "birthday");
        vm.stopPrank();

        assertEq(giftId, 0);

        uint256 bobBalanceBefore = bob.balance;

        vm.prank(bob);
        vault.claimGift(giftId);

        assertEq(bob.balance, bobBalanceBefore + 1 ether);
    }

    function test_AdminWithdrawAll() public {
        // fund vault with an unclaimed gift
        vm.deal(alice, 2 ether);
        vm.prank(alice);
        vault.createGift{value: 2 ether}(bob, "Hi", "gen");

        uint256 before = admin.balance;
        vault.withdraw(payable(admin));
        assertEq(admin.balance, before + 2 ether);
    }
}

