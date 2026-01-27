// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IFundTokenERC3643 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IIdentityRegistry {
    function isVerified(address wallet) external view returns (bool);
}

/**
 * @title InvestmentContract
 * @notice Manages on-chain investment tracking and capital contributions for tokenized funds
 * @dev Integrates with ERC-3643 tokens and identity verification
 */
contract InvestmentContract is AccessControl, ReentrancyGuard {
    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");
    bytes32 public constant GP_ROLE = keccak256("GP_ROLE");

    IIdentityRegistry public identityRegistry;

    struct Investment {
        address investor;
        address fundToken;
        uint256 amount;
        uint256 tokenAmount;
        uint256 timestamp;
        InvestmentStatus status;
        string txHash;
    }

    struct Fund {
        address fundToken;
        address gp;
        uint256 targetAmount;
        uint256 raisedAmount;
        uint256 minimumInvestment;
        bool active;
        uint256 investorCount;
    }

    enum InvestmentStatus {
        Pending,
        Confirmed,
        Cancelled,
        Withdrawn
    }

    mapping(uint256 => Fund) public funds;
    mapping(uint256 => Investment[]) public fundInvestments;
    mapping(address => uint256[]) public investorFunds;
    mapping(uint256 => mapping(address => uint256)) public investorTotalInvested;
    
    uint256 public fundCount;
    uint256 public totalInvestmentVolume;

    event FundRegistered(
        uint256 indexed fundId,
        address indexed fundToken,
        address indexed gp,
        uint256 targetAmount,
        uint256 minimumInvestment
    );

    event InvestmentRecorded(
        uint256 indexed fundId,
        uint256 indexed investmentId,
        address indexed investor,
        uint256 amount,
        uint256 tokenAmount
    );

    event InvestmentConfirmed(
        uint256 indexed fundId,
        uint256 indexed investmentId,
        address indexed investor
    );

    event InvestmentCancelled(
        uint256 indexed fundId,
        uint256 indexed investmentId,
        address indexed investor
    );

    event CapitalContributed(
        uint256 indexed fundId,
        address indexed investor,
        uint256 amount
    );

    event FundClosed(uint256 indexed fundId, uint256 finalAmount);

    constructor(address _identityRegistry) {
        require(_identityRegistry != address(0), "Invalid identity registry");
        identityRegistry = IIdentityRegistry(_identityRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FUND_MANAGER_ROLE, msg.sender);
    }

    /**
     * @notice Register a new fund for investment tracking
     * @param fundToken Address of the ERC-3643 fund token
     * @param gp Address of the General Partner
     * @param targetAmount Target fundraising amount
     * @param minimumInvestment Minimum investment amount per investor
     */
    function registerFund(
        address fundToken,
        address gp,
        uint256 targetAmount,
        uint256 minimumInvestment
    ) external onlyRole(FUND_MANAGER_ROLE) returns (uint256) {
        require(fundToken != address(0), "Invalid fund token");
        require(gp != address(0), "Invalid GP address");
        require(targetAmount > 0, "Target amount must be positive");

        uint256 fundId = fundCount++;

        funds[fundId] = Fund({
            fundToken: fundToken,
            gp: gp,
            targetAmount: targetAmount,
            raisedAmount: 0,
            minimumInvestment: minimumInvestment,
            active: true,
            investorCount: 0
        });

        _grantRole(GP_ROLE, gp);

        emit FundRegistered(fundId, fundToken, gp, targetAmount, minimumInvestment);

        return fundId;
    }

    /**
     * @notice Record a new investment (pending confirmation)
     * @param fundId ID of the fund
     * @param investor Address of the investor
     * @param amount Investment amount in USD (or base currency)
     * @param tokenAmount Amount of tokens to be issued
     * @param txHash Off-chain transaction reference
     */
    function recordInvestment(
        uint256 fundId,
        address investor,
        uint256 amount,
        uint256 tokenAmount,
        string calldata txHash
    ) external onlyRole(FUND_MANAGER_ROLE) returns (uint256) {
        require(fundId < fundCount, "Invalid fund ID");
        require(investor != address(0), "Invalid investor");
        require(amount > 0, "Amount must be positive");
        
        Fund storage fund = funds[fundId];
        require(fund.active, "Fund not active");
        require(amount >= fund.minimumInvestment, "Below minimum investment");

        // Verify investor identity
        require(identityRegistry.isVerified(investor), "Investor not verified");

        Investment memory investment = Investment({
            investor: investor,
            fundToken: fund.fundToken,
            amount: amount,
            tokenAmount: tokenAmount,
            timestamp: block.timestamp,
            status: InvestmentStatus.Pending,
            txHash: txHash
        });

        fundInvestments[fundId].push(investment);
        uint256 investmentId = fundInvestments[fundId].length - 1;

        // Track investor's funds
        if (investorTotalInvested[fundId][investor] == 0) {
            investorFunds[investor].push(fundId);
        }

        emit InvestmentRecorded(fundId, investmentId, investor, amount, tokenAmount);

        return investmentId;
    }

    /**
     * @notice Confirm an investment and update fund metrics
     * @param fundId ID of the fund
     * @param investmentId ID of the investment
     */
    function confirmInvestment(
        uint256 fundId,
        uint256 investmentId
    ) external onlyRole(FUND_MANAGER_ROLE) {
        require(fundId < fundCount, "Invalid fund ID");
        require(investmentId < fundInvestments[fundId].length, "Invalid investment ID");

        Investment storage investment = fundInvestments[fundId][investmentId];
        require(investment.status == InvestmentStatus.Pending, "Investment not pending");

        investment.status = InvestmentStatus.Confirmed;

        Fund storage fund = funds[fundId];
        
        // Update fund metrics
        if (investorTotalInvested[fundId][investment.investor] == 0) {
            fund.investorCount++;
        }
        
        investorTotalInvested[fundId][investment.investor] += investment.amount;
        fund.raisedAmount += investment.amount;
        totalInvestmentVolume += investment.amount;

        emit InvestmentConfirmed(fundId, investmentId, investment.investor);
        emit CapitalContributed(fundId, investment.investor, investment.amount);
    }

    /**
     * @notice Cancel a pending investment
     * @param fundId ID of the fund
     * @param investmentId ID of the investment
     */
    function cancelInvestment(
        uint256 fundId,
        uint256 investmentId
    ) external {
        require(fundId < fundCount, "Invalid fund ID");
        require(investmentId < fundInvestments[fundId].length, "Invalid investment ID");

        Investment storage investment = fundInvestments[fundId][investmentId];
        require(investment.status == InvestmentStatus.Pending, "Investment not pending");
        
        // Only fund manager or the investor can cancel
        require(
            hasRole(FUND_MANAGER_ROLE, msg.sender) || msg.sender == investment.investor,
            "Not authorized"
        );

        investment.status = InvestmentStatus.Cancelled;

        emit InvestmentCancelled(fundId, investmentId, investment.investor);
    }

    /**
     * @notice Close a fund (no more investments accepted)
     * @param fundId ID of the fund
     */
    function closeFund(uint256 fundId) external {
        require(fundId < fundCount, "Invalid fund ID");
        
        Fund storage fund = funds[fundId];
        require(
            hasRole(FUND_MANAGER_ROLE, msg.sender) || hasRole(GP_ROLE, msg.sender),
            "Not authorized"
        );
        require(fund.active, "Fund already closed");

        fund.active = false;

        emit FundClosed(fundId, fund.raisedAmount);
    }

    /**
     * @notice Get fund details
     * @param fundId ID of the fund
     */
    function getFund(uint256 fundId) external view returns (
        address fundToken,
        address gp,
        uint256 targetAmount,
        uint256 raisedAmount,
        uint256 minimumInvestment,
        bool active,
        uint256 investorCount
    ) {
        require(fundId < fundCount, "Invalid fund ID");
        Fund memory fund = funds[fundId];
        return (
            fund.fundToken,
            fund.gp,
            fund.targetAmount,
            fund.raisedAmount,
            fund.minimumInvestment,
            fund.active,
            fund.investorCount
        );
    }

    /**
     * @notice Get investment details
     * @param fundId ID of the fund
     * @param investmentId ID of the investment
     */
    function getInvestment(
        uint256 fundId,
        uint256 investmentId
    ) external view returns (
        address investor,
        address fundToken,
        uint256 amount,
        uint256 tokenAmount,
        uint256 timestamp,
        InvestmentStatus status,
        string memory txHash
    ) {
        require(fundId < fundCount, "Invalid fund ID");
        require(investmentId < fundInvestments[fundId].length, "Invalid investment ID");
        
        Investment memory investment = fundInvestments[fundId][investmentId];
        return (
            investment.investor,
            investment.fundToken,
            investment.amount,
            investment.tokenAmount,
            investment.timestamp,
            investment.status,
            investment.txHash
        );
    }

    /**
     * @notice Get total investments for a fund
     * @param fundId ID of the fund
     */
    function getFundInvestmentCount(uint256 fundId) external view returns (uint256) {
        require(fundId < fundCount, "Invalid fund ID");
        return fundInvestments[fundId].length;
    }

    /**
     * @notice Get investor's total investment in a fund
     * @param fundId ID of the fund
     * @param investor Address of the investor
     */
    function getInvestorTotal(uint256 fundId, address investor) external view returns (uint256) {
        require(fundId < fundCount, "Invalid fund ID");
        return investorTotalInvested[fundId][investor];
    }

    /**
     * @notice Get all funds an investor has invested in
     * @param investor Address of the investor
     */
    function getInvestorFunds(address investor) external view returns (uint256[] memory) {
        return investorFunds[investor];
    }

    /**
     * @notice Update identity registry
     * @param _identityRegistry New identity registry address
     */
    function setIdentityRegistry(address _identityRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_identityRegistry != address(0), "Invalid identity registry");
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }
}
