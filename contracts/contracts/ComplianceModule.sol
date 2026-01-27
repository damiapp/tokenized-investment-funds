// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IIdentityRegistry {
    function isVerified(address wallet) external view returns (bool);
    function hasClaim(address wallet, uint256 claimTopic) external view returns (bool);
    function getCountry(address wallet) external view returns (uint256);
}

contract ComplianceModule is Ownable {
    IIdentityRegistry public identityRegistry;

    struct TransferRestriction {
        bool enabled;
        uint256 maxHolders;
        uint256 minHoldingPeriod;
        bool requireAccredited;
        mapping(uint256 => bool) allowedCountries;
        mapping(uint256 => bool) blockedCountries;
        mapping(address => bool) whitelist;
        mapping(address => bool) blacklist;
    }

    mapping(address => TransferRestriction) private tokenRestrictions;
    mapping(address => uint256) public holderCount;
    mapping(address => mapping(address => uint256)) public firstTransferTime;

    uint256 public constant CLAIM_ACCREDITED_INVESTOR = 1;
    uint256 public constant CLAIM_KYC_VERIFIED = 2;

    event RestrictionEnabled(address indexed token);
    event RestrictionDisabled(address indexed token);
    event MaxHoldersUpdated(address indexed token, uint256 maxHolders);
    event MinHoldingPeriodUpdated(address indexed token, uint256 period);
    event CountryAllowed(address indexed token, uint256 country);
    event CountryBlocked(address indexed token, uint256 country);
    event AddressWhitelisted(address indexed token, address indexed account);
    event AddressBlacklisted(address indexed token, address indexed account);

    constructor(address _identityRegistry) {
        require(_identityRegistry != address(0), "Invalid identity registry");
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    function setIdentityRegistry(address _identityRegistry) external onlyOwner {
        require(_identityRegistry != address(0), "Invalid identity registry");
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    function enableRestrictions(address token) external onlyOwner {
        tokenRestrictions[token].enabled = true;
        emit RestrictionEnabled(token);
    }

    function disableRestrictions(address token) external onlyOwner {
        tokenRestrictions[token].enabled = false;
        emit RestrictionDisabled(token);
    }

    function setMaxHolders(address token, uint256 maxHolders) external onlyOwner {
        tokenRestrictions[token].maxHolders = maxHolders;
        emit MaxHoldersUpdated(token, maxHolders);
    }

    function setMinHoldingPeriod(address token, uint256 period) external onlyOwner {
        tokenRestrictions[token].minHoldingPeriod = period;
        emit MinHoldingPeriodUpdated(token, period);
    }

    function setRequireAccredited(address token, bool required) external onlyOwner {
        tokenRestrictions[token].requireAccredited = required;
    }

    function allowCountry(address token, uint256 country) external onlyOwner {
        tokenRestrictions[token].allowedCountries[country] = true;
        tokenRestrictions[token].blockedCountries[country] = false;
        emit CountryAllowed(token, country);
    }

    function blockCountry(address token, uint256 country) external onlyOwner {
        tokenRestrictions[token].blockedCountries[country] = true;
        tokenRestrictions[token].allowedCountries[country] = false;
        emit CountryBlocked(token, country);
    }

    function addToWhitelist(address token, address account) external onlyOwner {
        tokenRestrictions[token].whitelist[account] = true;
        tokenRestrictions[token].blacklist[account] = false;
        emit AddressWhitelisted(token, account);
    }

    function addToBlacklist(address token, address account) external onlyOwner {
        tokenRestrictions[token].blacklist[account] = true;
        tokenRestrictions[token].whitelist[account] = false;
        emit AddressBlacklisted(token, account);
    }

    function removeFromWhitelist(address token, address account) external onlyOwner {
        tokenRestrictions[token].whitelist[account] = false;
    }

    function removeFromBlacklist(address token, address account) external onlyOwner {
        tokenRestrictions[token].blacklist[account] = false;
    }

    function canTransfer(
        address token,
        address from,
        address to,
        uint256 amount
    ) external view returns (bool, string memory) {
        if (!tokenRestrictions[token].enabled) {
            return (true, "");
        }

        if (from == address(0)) {
            return _canReceive(token, to, amount);
        }

        if (to == address(0)) {
            return _canSend(token, from, amount);
        }

        (bool canSend, string memory sendReason) = _canSend(token, from, amount);
        if (!canSend) {
            return (false, sendReason);
        }

        (bool canReceive, string memory receiveReason) = _canReceive(token, to, amount);
        if (!canReceive) {
            return (false, receiveReason);
        }

        return (true, "");
    }

    function _canSend(
        address token,
        address from,
        uint256 /* amount */
    ) internal view returns (bool, string memory) {
        if (tokenRestrictions[token].blacklist[from]) {
            return (false, "Sender is blacklisted");
        }

        if (tokenRestrictions[token].whitelist[from]) {
            return (true, "");
        }

        if (!identityRegistry.isVerified(from)) {
            return (false, "Sender not verified");
        }

        uint256 holdingPeriod = tokenRestrictions[token].minHoldingPeriod;
        if (holdingPeriod > 0) {
            uint256 firstTransfer = firstTransferTime[token][from];
            if (firstTransfer > 0 && block.timestamp < firstTransfer + holdingPeriod) {
                return (false, "Minimum holding period not met");
            }
        }

        return (true, "");
    }

    function _canReceive(
        address token,
        address to,
        uint256 /* amount */
    ) internal view returns (bool, string memory) {
        if (tokenRestrictions[token].blacklist[to]) {
            return (false, "Receiver is blacklisted");
        }

        if (tokenRestrictions[token].whitelist[to]) {
            return (true, "");
        }

        if (!identityRegistry.isVerified(to)) {
            return (false, "Receiver not verified");
        }

        if (tokenRestrictions[token].requireAccredited) {
            if (!identityRegistry.hasClaim(to, CLAIM_ACCREDITED_INVESTOR)) {
                return (false, "Receiver must be accredited investor");
            }
        }

        try identityRegistry.getCountry(to) returns (uint256 country) {
            if (tokenRestrictions[token].blockedCountries[country]) {
                return (false, "Receiver country is blocked");
            }

            bool hasAllowedCountries = false;
            for (uint256 i = 1; i <= 250; i++) {
                if (tokenRestrictions[token].allowedCountries[i]) {
                    hasAllowedCountries = true;
                    break;
                }
            }

            if (hasAllowedCountries && !tokenRestrictions[token].allowedCountries[country]) {
                return (false, "Receiver country not allowed");
            }
        } catch {
            return (false, "Cannot verify receiver country");
        }

        uint256 maxHolders = tokenRestrictions[token].maxHolders;
        if (maxHolders > 0 && holderCount[token] >= maxHolders) {
            if (firstTransferTime[token][to] == 0) {
                return (false, "Maximum number of holders reached");
            }
        }

        return (true, "");
    }

    function updateHolderCount(address token, address account, bool isNewHolder) external {
        require(msg.sender == token, "Only token contract can update");
        
        if (isNewHolder) {
            holderCount[token]++;
            if (firstTransferTime[token][account] == 0) {
                firstTransferTime[token][account] = block.timestamp;
            }
        }
    }

    function decreaseHolderCount(address token) external {
        require(msg.sender == token, "Only token contract can update");
        if (holderCount[token] > 0) {
            holderCount[token]--;
        }
    }

    function isRestricted(address token) external view returns (bool) {
        return tokenRestrictions[token].enabled;
    }

    function getMaxHolders(address token) external view returns (uint256) {
        return tokenRestrictions[token].maxHolders;
    }

    function getMinHoldingPeriod(address token) external view returns (uint256) {
        return tokenRestrictions[token].minHoldingPeriod;
    }

    function isAccreditedRequired(address token) external view returns (bool) {
        return tokenRestrictions[token].requireAccredited;
    }

    function isCountryAllowed(address token, uint256 country) external view returns (bool) {
        return tokenRestrictions[token].allowedCountries[country];
    }

    function isCountryBlocked(address token, uint256 country) external view returns (bool) {
        return tokenRestrictions[token].blockedCountries[country];
    }

    function isWhitelisted(address token, address account) external view returns (bool) {
        return tokenRestrictions[token].whitelist[account];
    }

    function isBlacklisted(address token, address account) external view returns (bool) {
        return tokenRestrictions[token].blacklist[account];
    }
}
