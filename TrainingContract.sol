// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TrainingContract {
    uint256 public counter;
    mapping(address => uint256) public balances;
    address public owner;
    
    event CounterIncremented(address indexed user, uint256 newValue);
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    
    error InsufficientBalance(uint256 requested, uint256 available);
    error NotContractOwner(address caller, address owner);
    
    constructor() {
        counter = 0;
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotContractOwner(msg.sender, owner);
        }
        _;
    }
    
    function incrementCounter() public {
        counter += 1;
        emit CounterIncremented(msg.sender, counter);
    }
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    function withdraw(uint256 _amount) public {
        if (_amount > balances[msg.sender]) {
            revert InsufficientBalance(_amount, balances[msg.sender]);
        }
        
        balances[msg.sender] -= _amount;
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, _amount);
    }
    
    function resetCounter() public onlyOwner {
        counter = 0;
    }
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    function getMyBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
}