/* ============================================================================
 * FILE: src/contracts/lockInstance.js
 * PURPOSE: Builds a read/write contract wrapper for the USG (NFT) contract.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.2.0  2026-05-22  Cleanup pass 1
 *     - FIX: removed unused `web3-utils` import and the unused `toPlainString`
 *       helper (atomic CRNT no longer needs scientific-notation flattening; the
 *       frontend handles amounts as BigInt integers via utils/tokenMath).
 *     - NOTE: this module instantiates at import time based on window.ethereum.
 *       It is functional but fragile (no chain/account reactivity). Pass 2
 *       replaces it with wagmi/viem hooks. Left working for this pass.
 *   v0.1.0  Original as cloned.
 * ==========================================================================*/

import Web3 from 'web3'
import abi from './abi'
import getContractsAddress from './contractsAddress';

const provider = () => {
    // 1. Try getting newest provider
    const { ethereum } = window
    if (ethereum) return ethereum

    // 2. Try getting legacy provider
    const { web3 } = window
    if (web3 && web3.currentProvider) return web3.currentProvider
}

let contractInstance

// const BSC_URL = "https://bsc-dataseed1.binance.org";
const BSC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545";

if (provider()) {
    const web3 = new Web3(provider())
    const web3_read = new Web3(new Web3.providers.HttpProvider(BSC_URL));
    contractInstance = web3.eth.net.getId().then(id => {
        const address = getContractsAddress(id)
        const contractInstance = new web3.eth.Contract(abi, address)
        const readContract = new web3_read.eth.Contract(abi, address);
        return {
            async mint(count, sender) {
                try {
                    const res = await contractInstance.methods.mint(count).send({
                        'from': sender
                    })
                    return res;
                } catch (e) {
                    console.log(e)
                }
            },
            async claimReward(sender) {
                try {
                    const res = await contractInstance.methods.claimRewards().send({
                        'from': sender
                    })
                    return res;
                } catch (e) {
                    console.log(e)
                }
            },
            async setApprovalForAll(sender) {
                try {
                    const res = await contractInstance.methods.setApprovalForAll(process.env.REACT_APP_STAKING_ADDRESS, true).send({
                        'from': sender
                    })
                    return res;
                } catch (e) {
                    console.log(e)
                }
            },
            async totalSupply() {
                try {
                    const supply = await readContract.methods.totalSupply().call();
                    return supply;
                } catch (e) {
                    console.log(e);
                }
            },
            async getMintCost() {
                try {
                    const cost = await readContract.methods.cost().call();
                    return cost;
                } catch (e) {
                    console.log(e);
                }
            },
            async getMintReward(wallet) {
                try {
                    const cost = await contractInstance.methods.getReflectionBalances(wallet).call();
                    return cost;
                } catch (e) {
                    console.log(e);
                }
            },
            async getUserNFTs(address) {
                try {
                    console.log(address);
                    const ids = await contractInstance.methods.getTokenIds(address).call();
                    return ids;
                } catch (e) {
                    console.log(e);
                }
            },
            async getTokenURL(id) {
                try {
                    const url = await readContract.methods.tokenURI(id).call();
                    return url;
                } catch (e) {
                    console.log(e);
                }
            }
        }
    })
}

export default contractInstance
