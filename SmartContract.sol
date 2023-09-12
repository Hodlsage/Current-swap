// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC20 {
    function balanceOf(address who) external view returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);
}

contract SwapERC20 {
    uint256 public RATE = 10_000_000;
    address public OWNER;
    uint256 public raisedEth;

    IERC20 token;

    constructor(address _erc20Token) {
        token = IERC20(_erc20Token);
        OWNER = msg.sender;
    }

    function buy() public payable returns (bool) {
        uint256 tokenAmount = (msg.value * RATE * 100) / 1 ether;
        require(tokenAmount > 0, "Increase ETH Amount");
        require(
            token.balanceOf(address(this)) >= tokenAmount,
            "Insufficient Supply"
        );
        payable(OWNER).transfer(msg.value);
        token.transfer(msg.sender, tokenAmount);
        raisedEth += msg.value;
        return true;
    }

    function retrieveToken() public returns (bool) {
        require(msg.sender == OWNER, "Caller is not Owner ");
        token.transfer(msg.sender, remainingFund());
        return true;
    }

    function remainingFund() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function checkERC20Balance(address _user) public view returns (uint256) {
        return token.balanceOf(_user);
    }
}
