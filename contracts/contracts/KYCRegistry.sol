// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract KYCRegistry is Ownable {
    mapping(address => bool) private _verified;

    event Verified(address indexed account, bool verified);

    function isVerified(address account) external view returns (bool) {
        return _verified[account];
    }

    function setVerified(address account, bool verified) external onlyOwner {
        _verified[account] = verified;
        emit Verified(account, verified);
    }
}
