// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {GiftVault} from "../src/GiftVault.sol";

contract DeployGiftVault is Script {
    function run() external returns (GiftVault deployed) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        deployed = new GiftVault();
        vm.stopBroadcast();
    }
}

