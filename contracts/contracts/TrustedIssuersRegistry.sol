// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TrustedIssuersRegistry is Ownable {
    struct TrustedIssuer {
        bool exists;
        uint256[] claimTopics;
        string name;
        bool active;
    }

    mapping(address => TrustedIssuer) private trustedIssuers;
    address[] private issuersList;
    mapping(address => bool) private isIssuerRegistered;

    event IssuerAdded(address indexed issuer, uint256[] claimTopics, string name);
    event IssuerRemoved(address indexed issuer);
    event IssuerUpdated(address indexed issuer, uint256[] claimTopics);
    event IssuerStatusChanged(address indexed issuer, bool active);

    function addTrustedIssuer(
        address issuer,
        uint256[] calldata claimTopics,
        string calldata name
    ) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        require(!trustedIssuers[issuer].exists, "Issuer already exists");
        require(claimTopics.length > 0, "Must specify at least one claim topic");

        trustedIssuers[issuer].exists = true;
        trustedIssuers[issuer].claimTopics = claimTopics;
        trustedIssuers[issuer].name = name;
        trustedIssuers[issuer].active = true;

        if (!isIssuerRegistered[issuer]) {
            issuersList.push(issuer);
            isIssuerRegistered[issuer] = true;
        }

        emit IssuerAdded(issuer, claimTopics, name);
    }

    function removeTrustedIssuer(address issuer) external onlyOwner {
        require(trustedIssuers[issuer].exists, "Issuer does not exist");
        
        delete trustedIssuers[issuer];
        
        emit IssuerRemoved(issuer);
    }

    function updateIssuerClaimTopics(
        address issuer,
        uint256[] calldata claimTopics
    ) external onlyOwner {
        require(trustedIssuers[issuer].exists, "Issuer does not exist");
        require(claimTopics.length > 0, "Must specify at least one claim topic");

        trustedIssuers[issuer].claimTopics = claimTopics;

        emit IssuerUpdated(issuer, claimTopics);
    }

    function setIssuerStatus(address issuer, bool active) external onlyOwner {
        require(trustedIssuers[issuer].exists, "Issuer does not exist");
        
        trustedIssuers[issuer].active = active;

        emit IssuerStatusChanged(issuer, active);
    }

    function isTrustedIssuer(address issuer) external view returns (bool) {
        return trustedIssuers[issuer].exists && trustedIssuers[issuer].active;
    }

    function hasClaimTopic(address issuer, uint256 claimTopic) external view returns (bool) {
        if (!trustedIssuers[issuer].exists || !trustedIssuers[issuer].active) {
            return false;
        }

        uint256[] memory topics = trustedIssuers[issuer].claimTopics;
        for (uint256 i = 0; i < topics.length; i++) {
            if (topics[i] == claimTopic) {
                return true;
            }
        }
        return false;
    }

    function getTrustedIssuer(address issuer) 
        external 
        view 
        returns (
            bool exists,
            uint256[] memory claimTopics,
            string memory name,
            bool active
        ) 
    {
        TrustedIssuer storage issuerData = trustedIssuers[issuer];
        return (
            issuerData.exists,
            issuerData.claimTopics,
            issuerData.name,
            issuerData.active
        );
    }

    function getTrustedIssuersCount() external view returns (uint256) {
        return issuersList.length;
    }

    function getTrustedIssuerAt(uint256 index) external view returns (address) {
        require(index < issuersList.length, "Index out of bounds");
        return issuersList[index];
    }

    function getTrustedIssuers() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < issuersList.length; i++) {
            if (trustedIssuers[issuersList[i]].exists && trustedIssuers[issuersList[i]].active) {
                activeCount++;
            }
        }

        address[] memory activeIssuers = new address[](activeCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < issuersList.length; i++) {
            if (trustedIssuers[issuersList[i]].exists && trustedIssuers[issuersList[i]].active) {
                activeIssuers[currentIndex] = issuersList[i];
                currentIndex++;
            }
        }

        return activeIssuers;
    }
}
