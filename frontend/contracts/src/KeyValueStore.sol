// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract KeyValueStore {
    // Simple mapping from string key to string value
    mapping(string => string) private keyToValue;

    event Inserted(string indexed key, string value);

    function insert(string calldata key, string calldata value) external {
        keyToValue[key] = value;
        emit Inserted(key, value);
    }

    function get(string calldata key) external view returns (string memory) {
        return keyToValue[key];
    }
}

