// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IKYCRegistry {
    function isVerified(address account) external view returns (bool);
}

contract FundToken is ERC20, Ownable {
    IKYCRegistry public kycRegistry;

    error NotVerified(address account);
    error RegistryNotSet();

    constructor(
        string memory name_,
        string memory symbol_,
        address registry_
    ) ERC20(name_, symbol_) {
        kycRegistry = IKYCRegistry(registry_);
    }

    function setKycRegistry(address registry_) external onlyOwner {
        kycRegistry = IKYCRegistry(registry_);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        super._beforeTokenTransfer(from, to, amount);

        if (amount == 0) {
            return;
        }

        if (address(kycRegistry) == address(0)) {
            revert RegistryNotSet();
        }

        if (from != address(0)) {
            if (!kycRegistry.isVerified(from)) {
                revert NotVerified(from);
            }
        }

        if (to != address(0)) {
            if (!kycRegistry.isVerified(to)) {
                revert NotVerified(to);
            }
        }
    }
}
