// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FundTokenERC3643.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FundFactory
 * @dev Factory contract for deploying and managing investment fund tokens
 * Implements factory pattern for standardized fund deployment and on-chain registry
 */
contract FundFactory is Ownable {
    struct FundInfo {
        uint256 id;
        address tokenAddress;
        address gp;
        string name;
        string symbol;
        uint256 targetAmount;
        uint256 minimumInvestment;
        uint256 createdAt;
        bool active;
    }

    // State variables
    uint256 private fundCounter;
    mapping(uint256 => FundInfo) public funds;
    mapping(address => uint256[]) public fundsByGP;
    mapping(address => uint256) public tokenToFundId;
    
    address public identityRegistry;
    address public complianceModule;
    
    // Approved GPs who can create funds
    mapping(address => bool) public approvedGPs;

    // Events
    event FundCreated(
        uint256 indexed fundId,
        address indexed tokenAddress,
        address indexed gp,
        string name,
        string symbol,
        uint256 targetAmount
    );
    event FundDeactivated(uint256 indexed fundId);
    event FundReactivated(uint256 indexed fundId);
    event GPApproved(address indexed gp);
    event GPRevoked(address indexed gp);
    event IdentityRegistryUpdated(address indexed newRegistry);
    event ComplianceModuleUpdated(address indexed newModule);

    // Errors
    error NotApprovedGP(address gp);
    error FundNotFound(uint256 fundId);
    error InvalidAddress();
    error InvalidParameters();

    constructor(address identityRegistry_, address complianceModule_) {
        require(identityRegistry_ != address(0), "Invalid identity registry");
        require(complianceModule_ != address(0), "Invalid compliance module");
        
        identityRegistry = identityRegistry_;
        complianceModule = complianceModule_;
    }

    /**
     * @dev Create a new fund token
     * @param name Fund name
     * @param symbol Token symbol
     * @param targetAmount Target fundraising amount
     * @param minimumInvestment Minimum investment amount
     * @return fundId The ID of the newly created fund
     */
    function createFund(
        string memory name,
        string memory symbol,
        uint256 targetAmount,
        uint256 minimumInvestment
    ) external returns (uint256 fundId) {
        if (!approvedGPs[msg.sender]) {
            revert NotApprovedGP(msg.sender);
        }
        
        if (bytes(name).length == 0 || bytes(symbol).length == 0) {
            revert InvalidParameters();
        }
        
        if (targetAmount == 0 || minimumInvestment == 0) {
            revert InvalidParameters();
        }

        // Deploy new FundTokenERC3643
        FundTokenERC3643 fundToken = new FundTokenERC3643(
            name,
            symbol,
            identityRegistry,
            complianceModule
        );

        // Transfer ownership to GP
        fundToken.transferOwnership(msg.sender);

        // Increment counter and create fund info
        fundCounter++;
        fundId = fundCounter;

        funds[fundId] = FundInfo({
            id: fundId,
            tokenAddress: address(fundToken),
            gp: msg.sender,
            name: name,
            symbol: symbol,
            targetAmount: targetAmount,
            minimumInvestment: minimumInvestment,
            createdAt: block.timestamp,
            active: true
        });

        fundsByGP[msg.sender].push(fundId);
        tokenToFundId[address(fundToken)] = fundId;

        emit FundCreated(
            fundId,
            address(fundToken),
            msg.sender,
            name,
            symbol,
            targetAmount
        );

        return fundId;
    }

    /**
     * @dev Get fund information by ID
     * @param fundId The fund ID
     * @return Fund information struct
     */
    function getFund(uint256 fundId) external view returns (FundInfo memory) {
        if (fundId == 0 || fundId > fundCounter) {
            revert FundNotFound(fundId);
        }
        return funds[fundId];
    }

    /**
     * @dev Get total number of funds created
     * @return Total fund count
     */
    function getFundCount() external view returns (uint256) {
        return fundCounter;
    }

    /**
     * @dev Get all fund IDs created by a specific GP
     * @param gp The GP address
     * @return Array of fund IDs
     */
    function getFundsByGP(address gp) external view returns (uint256[] memory) {
        return fundsByGP[gp];
    }

    /**
     * @dev Get fund ID from token address
     * @param tokenAddress The fund token address
     * @return Fund ID
     */
    function getFundIdByToken(address tokenAddress) external view returns (uint256) {
        return tokenToFundId[tokenAddress];
    }

    /**
     * @dev Get all active funds (paginated)
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return Array of fund information
     */
    function getActiveFunds(uint256 offset, uint256 limit) 
        external 
        view 
        returns (FundInfo[] memory) 
    {
        require(limit > 0 && limit <= 100, "Invalid limit");
        
        // Count active funds
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= fundCounter; i++) {
            if (funds[i].active) {
                activeCount++;
            }
        }

        // Calculate actual return size
        uint256 start = offset;
        uint256 end = offset + limit;
        if (end > activeCount) {
            end = activeCount;
        }
        
        if (start >= activeCount) {
            return new FundInfo[](0);
        }

        uint256 resultSize = end - start;
        FundInfo[] memory result = new FundInfo[](resultSize);
        
        uint256 currentIndex = 0;
        uint256 resultIndex = 0;
        
        for (uint256 i = 1; i <= fundCounter && resultIndex < resultSize; i++) {
            if (funds[i].active) {
                if (currentIndex >= start) {
                    result[resultIndex] = funds[i];
                    resultIndex++;
                }
                currentIndex++;
            }
        }

        return result;
    }

    /**
     * @dev Deactivate a fund (GP only)
     * @param fundId The fund ID to deactivate
     */
    function deactivateFund(uint256 fundId) external {
        if (fundId == 0 || fundId > fundCounter) {
            revert FundNotFound(fundId);
        }
        
        FundInfo storage fund = funds[fundId];
        require(fund.gp == msg.sender, "Only GP can deactivate");
        require(fund.active, "Fund already inactive");

        fund.active = false;
        emit FundDeactivated(fundId);
    }

    /**
     * @dev Reactivate a fund (GP only)
     * @param fundId The fund ID to reactivate
     */
    function reactivateFund(uint256 fundId) external {
        if (fundId == 0 || fundId > fundCounter) {
            revert FundNotFound(fundId);
        }
        
        FundInfo storage fund = funds[fundId];
        require(fund.gp == msg.sender, "Only GP can reactivate");
        require(!fund.active, "Fund already active");

        fund.active = true;
        emit FundReactivated(fundId);
    }

    /**
     * @dev Approve a GP to create funds (owner only)
     * @param gp The GP address to approve
     */
    function approveGP(address gp) external onlyOwner {
        if (gp == address(0)) {
            revert InvalidAddress();
        }
        
        approvedGPs[gp] = true;
        emit GPApproved(gp);
    }

    /**
     * @dev Revoke GP approval (owner only)
     * @param gp The GP address to revoke
     */
    function revokeGP(address gp) external onlyOwner {
        approvedGPs[gp] = false;
        emit GPRevoked(gp);
    }

    /**
     * @dev Batch approve multiple GPs (owner only)
     * @param gps Array of GP addresses to approve
     */
    function batchApproveGPs(address[] calldata gps) external onlyOwner {
        for (uint256 i = 0; i < gps.length; i++) {
            if (gps[i] != address(0)) {
                approvedGPs[gps[i]] = true;
                emit GPApproved(gps[i]);
            }
        }
    }

    /**
     * @dev Update identity registry address (owner only)
     * @param newRegistry New identity registry address
     */
    function updateIdentityRegistry(address newRegistry) external onlyOwner {
        if (newRegistry == address(0)) {
            revert InvalidAddress();
        }
        
        identityRegistry = newRegistry;
        emit IdentityRegistryUpdated(newRegistry);
    }

    /**
     * @dev Update compliance module address (owner only)
     * @param newModule New compliance module address
     */
    function updateComplianceModule(address newModule) external onlyOwner {
        if (newModule == address(0)) {
            revert InvalidAddress();
        }
        
        complianceModule = newModule;
        emit ComplianceModuleUpdated(newModule);
    }

    /**
     * @dev Check if an address is an approved GP
     * @param gp The address to check
     * @return True if approved
     */
    function isApprovedGP(address gp) external view returns (bool) {
        return approvedGPs[gp];
    }
}
