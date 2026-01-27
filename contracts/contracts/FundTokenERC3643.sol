// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IIdentityRegistry {
    function isVerified(address wallet) external view returns (bool);
    function hasClaim(address wallet, uint256 claimTopic) external view returns (bool);
    function getCountry(address wallet) external view returns (uint256);
}

interface IComplianceModule {
    function canTransfer(
        address token,
        address from,
        address to,
        uint256 amount
    ) external view returns (bool, string memory);
    
    function updateHolderCount(address token, address account, bool isNewHolder) external;
    function decreaseHolderCount(address token) external;
}

contract FundTokenERC3643 is ERC20, Ownable {
    IIdentityRegistry public identityRegistry;
    IComplianceModule public complianceModule;
    
    bool public complianceEnabled;
    mapping(address => bool) public frozen;
    mapping(address => uint256) public frozenTokens;

    event IdentityRegistrySet(address indexed registry);
    event ComplianceModuleSet(address indexed module);
    event ComplianceEnabled(bool enabled);
    event TokensFrozen(address indexed account, uint256 amount);
    event TokensUnfrozen(address indexed account, uint256 amount);
    event AccountFrozen(address indexed account);
    event AccountUnfrozen(address indexed account);
    event ForcedTransfer(address indexed from, address indexed to, uint256 amount, address indexed executor);
    event TokensRecovered(address indexed lostWallet, address indexed newWallet, uint256 amount);

    error NotVerified(address account);
    error RegistryNotSet();
    error ComplianceModuleNotSet();
    error TransferNotCompliant(string reason);
    error AccountIsFrozen(address account);
    error InsufficientUnfrozenBalance(uint256 available, uint256 required);

    constructor(
        string memory name_,
        string memory symbol_,
        address identityRegistry_,
        address complianceModule_
    ) ERC20(name_, symbol_) {
        require(identityRegistry_ != address(0), "Invalid identity registry");
        require(complianceModule_ != address(0), "Invalid compliance module");
        
        identityRegistry = IIdentityRegistry(identityRegistry_);
        complianceModule = IComplianceModule(complianceModule_);
        complianceEnabled = true;
    }

    function setIdentityRegistry(address registry_) external onlyOwner {
        require(registry_ != address(0), "Invalid registry address");
        identityRegistry = IIdentityRegistry(registry_);
        emit IdentityRegistrySet(registry_);
    }

    function setComplianceModule(address module_) external onlyOwner {
        require(module_ != address(0), "Invalid module address");
        complianceModule = IComplianceModule(module_);
        emit ComplianceModuleSet(module_);
    }

    function setComplianceEnabled(bool enabled) external onlyOwner {
        complianceEnabled = enabled;
        emit ComplianceEnabled(enabled);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    function freezeAccount(address account) external onlyOwner {
        require(!frozen[account], "Account already frozen");
        frozen[account] = true;
        emit AccountFrozen(account);
    }

    function unfreezeAccount(address account) external onlyOwner {
        require(frozen[account], "Account not frozen");
        frozen[account] = false;
        emit AccountUnfrozen(account);
    }

    function freezePartialTokens(address account, uint256 amount) external onlyOwner {
        require(balanceOf(account) >= frozenTokens[account] + amount, "Insufficient balance");
        frozenTokens[account] += amount;
        emit TokensFrozen(account, amount);
    }

    function unfreezePartialTokens(address account, uint256 amount) external onlyOwner {
        require(frozenTokens[account] >= amount, "Insufficient frozen tokens");
        frozenTokens[account] -= amount;
        emit TokensUnfrozen(account, amount);
    }

    function forcedTransfer(
        address from,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(from != address(0), "Invalid from address");
        require(to != address(0), "Invalid to address");
        require(balanceOf(from) >= amount, "Insufficient balance");

        _transfer(from, to, amount);
        emit ForcedTransfer(from, to, amount, msg.sender);
    }

    function recoveryTransfer(
        address lostWallet,
        address newWallet,
        uint256 amount
    ) external onlyOwner {
        require(lostWallet != address(0), "Invalid lost wallet");
        require(newWallet != address(0), "Invalid new wallet");
        require(identityRegistry.isVerified(newWallet), "New wallet not verified");
        require(balanceOf(lostWallet) >= amount, "Insufficient balance");

        _transfer(lostWallet, newWallet, amount);
        emit TokensRecovered(lostWallet, newWallet, amount);
    }

    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }

    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }

    function getAvailableBalance(address account) public view returns (uint256) {
        uint256 balance = balanceOf(account);
        uint256 frozenAmount = frozenTokens[account];
        return balance > frozenAmount ? balance - frozenAmount : 0;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);

        if (amount == 0) {
            return;
        }

        if (from != address(0) && frozen[from]) {
            revert AccountIsFrozen(from);
        }

        if (to != address(0) && frozen[to]) {
            revert AccountIsFrozen(to);
        }

        if (from != address(0)) {
            uint256 available = getAvailableBalance(from);
            if (available < amount) {
                revert InsufficientUnfrozenBalance(available, amount);
            }
        }

        if (!complianceEnabled) {
            return;
        }

        if (address(identityRegistry) == address(0)) {
            revert RegistryNotSet();
        }

        if (address(complianceModule) == address(0)) {
            revert ComplianceModuleNotSet();
        }

        if (from != address(0)) {
            if (!identityRegistry.isVerified(from)) {
                revert NotVerified(from);
            }
        }

        if (to != address(0)) {
            if (!identityRegistry.isVerified(to)) {
                revert NotVerified(to);
            }
        }

        (bool canTransfer, string memory reason) = complianceModule.canTransfer(
            address(this),
            from,
            to,
            amount
        );

        if (!canTransfer) {
            revert TransferNotCompliant(reason);
        }
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._afterTokenTransfer(from, to, amount);

        if (amount == 0 || !complianceEnabled) {
            return;
        }

        if (address(complianceModule) == address(0)) {
            return;
        }

        if (to != address(0) && from != address(0)) {
            uint256 recipientBalance = balanceOf(to);
            if (recipientBalance == amount) {
                complianceModule.updateHolderCount(address(this), to, true);
            }
        } else if (to != address(0)) {
            complianceModule.updateHolderCount(address(this), to, true);
        }

        if (from != address(0) && balanceOf(from) == 0) {
            complianceModule.decreaseHolderCount(address(this));
        }
    }

    function isVerified(address account) external view returns (bool) {
        if (address(identityRegistry) == address(0)) {
            return false;
        }
        return identityRegistry.isVerified(account);
    }

    function canTransfer(address from, address to, uint256 amount) external view returns (bool, string memory) {
        if (!complianceEnabled) {
            return (true, "Compliance disabled");
        }

        if (address(complianceModule) == address(0)) {
            return (false, "Compliance module not set");
        }

        if (frozen[from]) {
            return (false, "Sender account frozen");
        }

        if (frozen[to]) {
            return (false, "Receiver account frozen");
        }

        uint256 available = getAvailableBalance(from);
        if (available < amount) {
            return (false, "Insufficient unfrozen balance");
        }

        return complianceModule.canTransfer(address(this), from, to, amount);
    }
}
