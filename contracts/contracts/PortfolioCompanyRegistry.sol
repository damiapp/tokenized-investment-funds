// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PortfolioCompanyRegistry
 * @notice Manages portfolio companies for investment funds
 * @dev Tracks companies, valuations, and fund ownership
 */
contract PortfolioCompanyRegistry is AccessControl {
    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");
    bytes32 public constant GP_ROLE = keccak256("GP_ROLE");

    struct Company {
        string name;
        string industry;
        string country;
        uint256 foundedYear;
        address registeredBy;
        uint256 registeredAt;
        bool active;
    }

    struct Investment {
        uint256 companyId;
        uint256 fundId;
        uint256 amount;
        uint256 equityPercentage;
        uint256 valuation;
        uint256 investedAt;
        bool active;
    }

    mapping(uint256 => Company) public companies;
    mapping(uint256 => Investment[]) public companyInvestments;
    mapping(uint256 => uint256[]) public fundPortfolio;
    mapping(uint256 => mapping(uint256 => bool)) public fundOwnsCompany;
    
    uint256 public companyCount;
    uint256[] public activeCompanies;
    mapping(uint256 => bool) public isActiveCompany;

    event CompanyRegistered(
        uint256 indexed companyId,
        string name,
        string industry,
        address indexed registeredBy
    );

    event InvestmentRecorded(
        uint256 indexed companyId,
        uint256 indexed fundId,
        uint256 amount,
        uint256 equityPercentage,
        uint256 valuation
    );

    event CompanyDeactivated(uint256 indexed companyId);
    event CompanyReactivated(uint256 indexed companyId);

    event ValuationUpdated(
        uint256 indexed companyId,
        uint256 indexed fundId,
        uint256 oldValuation,
        uint256 newValuation
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FUND_MANAGER_ROLE, msg.sender);
    }

    function registerCompany(
        string calldata name,
        string calldata industry,
        string calldata country,
        uint256 foundedYear
    ) external onlyRole(FUND_MANAGER_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(foundedYear <= block.timestamp / 365 days + 1970, "Invalid year");

        uint256 companyId = companyCount++;

        companies[companyId] = Company({
            name: name,
            industry: industry,
            country: country,
            foundedYear: foundedYear,
            registeredBy: msg.sender,
            registeredAt: block.timestamp,
            active: true
        });

        activeCompanies.push(companyId);
        isActiveCompany[companyId] = true;

        emit CompanyRegistered(companyId, name, industry, msg.sender);

        return companyId;
    }

    function recordInvestment(
        uint256 companyId,
        uint256 fundId,
        uint256 amount,
        uint256 equityPercentage,
        uint256 valuation
    ) external onlyRole(FUND_MANAGER_ROLE) {
        require(companyId < companyCount, "Invalid company");
        require(companies[companyId].active, "Company not active");
        require(amount > 0, "Amount must be positive");
        require(equityPercentage > 0 && equityPercentage <= 10000, "Invalid equity"); // basis points

        Investment memory investment = Investment({
            companyId: companyId,
            fundId: fundId,
            amount: amount,
            equityPercentage: equityPercentage,
            valuation: valuation,
            investedAt: block.timestamp,
            active: true
        });

        companyInvestments[companyId].push(investment);

        if (!fundOwnsCompany[fundId][companyId]) {
            fundPortfolio[fundId].push(companyId);
            fundOwnsCompany[fundId][companyId] = true;
        }

        emit InvestmentRecorded(companyId, fundId, amount, equityPercentage, valuation);
    }

    function updateValuation(
        uint256 companyId,
        uint256 fundId,
        uint256 investmentIndex,
        uint256 newValuation
    ) external onlyRole(FUND_MANAGER_ROLE) {
        require(companyId < companyCount, "Invalid company");
        require(investmentIndex < companyInvestments[companyId].length, "Invalid investment");

        Investment storage investment = companyInvestments[companyId][investmentIndex];
        require(investment.fundId == fundId, "Fund mismatch");
        require(investment.active, "Investment not active");

        uint256 oldValuation = investment.valuation;
        investment.valuation = newValuation;

        emit ValuationUpdated(companyId, fundId, oldValuation, newValuation);
    }

    function deactivateCompany(uint256 companyId) external onlyRole(FUND_MANAGER_ROLE) {
        require(companyId < companyCount, "Invalid company");
        require(companies[companyId].active, "Already inactive");

        companies[companyId].active = false;
        isActiveCompany[companyId] = false;

        emit CompanyDeactivated(companyId);
    }

    function reactivateCompany(uint256 companyId) external onlyRole(FUND_MANAGER_ROLE) {
        require(companyId < companyCount, "Invalid company");
        require(!companies[companyId].active, "Already active");

        companies[companyId].active = true;
        isActiveCompany[companyId] = true;

        emit CompanyReactivated(companyId);
    }

    function getCompany(uint256 companyId) external view returns (
        string memory name,
        string memory industry,
        string memory country,
        uint256 foundedYear,
        address registeredBy,
        uint256 registeredAt,
        bool active
    ) {
        require(companyId < companyCount, "Invalid company");
        Company memory company = companies[companyId];
        return (
            company.name,
            company.industry,
            company.country,
            company.foundedYear,
            company.registeredBy,
            company.registeredAt,
            company.active
        );
    }

    function getCompanyInvestments(uint256 companyId) external view returns (Investment[] memory) {
        require(companyId < companyCount, "Invalid company");
        return companyInvestments[companyId];
    }

    function getFundPortfolio(uint256 fundId) external view returns (uint256[] memory) {
        return fundPortfolio[fundId];
    }

    function getActiveCompanies() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < activeCompanies.length; i++) {
            if (isActiveCompany[activeCompanies[i]]) {
                activeCount++;
            }
        }

        uint256[] memory result = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < activeCompanies.length; i++) {
            if (isActiveCompany[activeCompanies[i]]) {
                result[index++] = activeCompanies[i];
            }
        }

        return result;
    }

    function getTotalInvestmentInCompany(uint256 companyId) external view returns (uint256) {
        require(companyId < companyCount, "Invalid company");
        
        uint256 total = 0;
        Investment[] memory investments = companyInvestments[companyId];
        
        for (uint256 i = 0; i < investments.length; i++) {
            if (investments[i].active) {
                total += investments[i].amount;
            }
        }
        
        return total;
    }

    function getFundEquityInCompany(uint256 fundId, uint256 companyId) external view returns (uint256) {
        require(companyId < companyCount, "Invalid company");
        
        uint256 totalEquity = 0;
        Investment[] memory investments = companyInvestments[companyId];
        
        for (uint256 i = 0; i < investments.length; i++) {
            if (investments[i].active && investments[i].fundId == fundId) {
                totalEquity += investments[i].equityPercentage;
            }
        }
        
        return totalEquity;
    }
}
