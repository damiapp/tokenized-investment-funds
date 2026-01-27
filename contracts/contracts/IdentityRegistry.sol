// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IClaimIssuer {
    function isClaimValid(address identity, uint256 claimTopic) external view returns (bool);
}

contract IdentityRegistry is Ownable {
    struct Identity {
        bool exists;
        uint256 investorCountry;
        address[] claimIssuers;
        mapping(uint256 => bool) claims;
    }

    mapping(address => Identity) private identities;
    mapping(address => address) public linkedWallets;
    
    address[] private registeredIdentities;
    mapping(address => bool) private isRegistered;

    event IdentityRegistered(address indexed identity, uint256 country);
    event IdentityRemoved(address indexed identity);
    event ClaimAdded(address indexed identity, uint256 indexed claimTopic);
    event ClaimRemoved(address indexed identity, uint256 indexed claimTopic);
    event CountryUpdated(address indexed identity, uint256 country);
    event WalletLinked(address indexed identity, address indexed wallet);

    modifier onlyRegistered(address identity) {
        require(identities[identity].exists, "Identity not registered");
        _;
    }

    function registerIdentity(
        address identity,
        uint256 country
    ) external onlyOwner {
        require(!identities[identity].exists, "Identity already registered");
        require(identity != address(0), "Invalid identity address");

        Identity storage newIdentity = identities[identity];
        newIdentity.exists = true;
        newIdentity.investorCountry = country;

        if (!isRegistered[identity]) {
            registeredIdentities.push(identity);
            isRegistered[identity] = true;
        }

        emit IdentityRegistered(identity, country);
    }

    function removeIdentity(address identity) external onlyOwner onlyRegistered(identity) {
        delete identities[identity];
        emit IdentityRemoved(identity);
    }

    function updateCountry(address identity, uint256 country) 
        external 
        onlyOwner 
        onlyRegistered(identity) 
    {
        identities[identity].investorCountry = country;
        emit CountryUpdated(identity, country);
    }

    function addClaim(
        address identity,
        uint256 claimTopic
    ) external onlyOwner onlyRegistered(identity) {
        require(!identities[identity].claims[claimTopic], "Claim already exists");
        identities[identity].claims[claimTopic] = true;
        emit ClaimAdded(identity, claimTopic);
    }

    function removeClaim(
        address identity,
        uint256 claimTopic
    ) external onlyOwner onlyRegistered(identity) {
        require(identities[identity].claims[claimTopic], "Claim does not exist");
        identities[identity].claims[claimTopic] = false;
        emit ClaimRemoved(identity, claimTopic);
    }

    function linkWallet(address identity, address wallet) 
        external 
        onlyOwner 
        onlyRegistered(identity) 
    {
        require(wallet != address(0), "Invalid wallet address");
        linkedWallets[wallet] = identity;
        emit WalletLinked(identity, wallet);
    }

    function isVerified(address wallet) public view returns (bool) {
        address identity = linkedWallets[wallet];
        if (identity == address(0)) {
            identity = wallet;
        }
        return identities[identity].exists;
    }

    function hasClaim(address wallet, uint256 claimTopic) public view returns (bool) {
        address identity = linkedWallets[wallet];
        if (identity == address(0)) {
            identity = wallet;
        }
        return identities[identity].exists && identities[identity].claims[claimTopic];
    }

    function getCountry(address wallet) public view returns (uint256) {
        address identity = linkedWallets[wallet];
        if (identity == address(0)) {
            identity = wallet;
        }
        require(identities[identity].exists, "Identity not found");
        return identities[identity].investorCountry;
    }

    function getIdentity(address wallet) public view returns (address) {
        address identity = linkedWallets[wallet];
        if (identity == address(0)) {
            return wallet;
        }
        return identity;
    }

    function getRegisteredIdentitiesCount() public view returns (uint256) {
        return registeredIdentities.length;
    }

    function getRegisteredIdentityAt(uint256 index) public view returns (address) {
        require(index < registeredIdentities.length, "Index out of bounds");
        return registeredIdentities[index];
    }

    function batchRegisterIdentities(
        address[] calldata _identities,
        uint256[] calldata countries
    ) external onlyOwner {
        require(_identities.length == countries.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _identities.length; i++) {
            if (!identities[_identities[i]].exists && _identities[i] != address(0)) {
                Identity storage newIdentity = identities[_identities[i]];
                newIdentity.exists = true;
                newIdentity.investorCountry = countries[i];

                if (!isRegistered[_identities[i]]) {
                    registeredIdentities.push(_identities[i]);
                    isRegistered[_identities[i]] = true;
                }

                emit IdentityRegistered(_identities[i], countries[i]);
            }
        }
    }
}
