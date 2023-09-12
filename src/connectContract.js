import { ethers } from "ethers";
let contract;
const connectContract = async () => {
     const Address = "0x5073AC30217E22D3477E8b15f329dC87262A7F85";
     const Abi = [
          {
               "inputs": [
                    {
                         "internalType": "address",
                         "name": "_erc20Token",
                         "type": "address"
                    }
               ],
               "stateMutability": "nonpayable",
               "type": "constructor"
          },
          {
               "inputs": [],
               "name": "OWNER",
               "outputs": [
                    {
                         "internalType": "address",
                         "name": "",
                         "type": "address"
                    }
               ],
               "stateMutability": "view",
               "type": "function"
          },
          {
               "inputs": [],
               "name": "RATE",
               "outputs": [
                    {
                         "internalType": "uint256",
                         "name": "",
                         "type": "uint256"
                    }
               ],
               "stateMutability": "view",
               "type": "function"
          },
          {
               "inputs": [],
               "name": "buy",
               "outputs": [
                    {
                         "internalType": "bool",
                         "name": "",
                         "type": "bool"
                    }
               ],
               "stateMutability": "payable",
               "type": "function"
          },
          {
               "inputs": [
                    {
                         "internalType": "address",
                         "name": "_user",
                         "type": "address"
                    }
               ],
               "name": "checkERC20Balance",
               "outputs": [
                    {
                         "internalType": "uint256",
                         "name": "",
                         "type": "uint256"
                    }
               ],
               "stateMutability": "view",
               "type": "function"
          },
          {
               "inputs": [],
               "name": "raisedEth",
               "outputs": [
                    {
                         "internalType": "uint256",
                         "name": "",
                         "type": "uint256"
                    }
               ],
               "stateMutability": "view",
               "type": "function"
          },
          {
               "inputs": [],
               "name": "remainingFund",
               "outputs": [
                    {
                         "internalType": "uint256",
                         "name": "",
                         "type": "uint256"
                    }
               ],
               "stateMutability": "view",
               "type": "function"
          },
          {
               "inputs": [],
               "name": "retrieveToken",
               "outputs": [
                    {
                         "internalType": "bool",
                         "name": "",
                         "type": "bool"
                    }
               ],
               "stateMutability": "nonpayable",
               "type": "function"
          }
     ];
     const provider = new ethers.providers.Web3Provider(window.ethereum);
     const signer = provider.getSigner();
     contract = new ethers.Contract(Address, Abi, signer);
};
export default connectContract;
export { contract };
