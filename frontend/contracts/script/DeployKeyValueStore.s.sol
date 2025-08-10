// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {KeyValueStore} from "../src/KeyValueStore.sol";

contract DeployKeyValueStore is Script {
    function run() external returns (KeyValueStore deployed) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        deployed = new KeyValueStore();
        vm.stopBroadcast();
    }
}

