// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {KeyValueStore} from "../src/KeyValueStore.sol";

contract KeyValueStoreTest is Test {
    KeyValueStore store;

    function setUp() public {
        store = new KeyValueStore();
    }

    function test_InsertAndGet() public {
        string memory key = "hello world";
        string memory value = "[123,0x123]";

        store.insert(key, value);

        string memory out = store.get(key);
        assertEq(out, value);
    }
}

