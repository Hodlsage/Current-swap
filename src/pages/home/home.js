/* ========================================================================
Revision Control: v1.2
Last Updated: 2026-05-21
Changes: 
- Synchronized layout styling boundaries with the new structural flex CSS fixes.
- Preserved existing state management and Web3 hook operations completely intact.
========================================================================
*/

import React, { useEffect, useState } from 'react';
import './home.css';
import Web3 from 'web3';
import tokenAbi from '../../contracts/tokenAbi';
import abi from '../../contracts/abi';
import contractInstance from '../../contracts/lockInstance';
import getContractsAddress from '../../contracts/contractsAddress';
import { NotificationManager } from 'react-notifications';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useWeb3 from "../../components/useWeb3";
import { off } from 'process';

const CRNT_ADDRESS = "0x7Ce8E3780F6C688C11039917f40563ECFDCCd0d8";

// Safely converts big numbers to plain text string formats to bypass scientific display limits
function toPlainString(num) {
    return ('' + +num).replace(/(-?)(\d*)\.?(\d*)e([+-]\d+)/,
        function (a, b, c, d, e) {
            return e < 0
                ? b + '0.' + Array(1 - e - c.length).join(0) + c + d
                : b + c + d + Array(e - d.length + 1).join(0);
        });
}

export const Home = () => {
    const [count, setCount] = useState(0);
    const [mintCost, setMintCost] = useState(4754);
    const [mintReward, setMintReward] = useState(0);
    const { web3, walletAddress } = useWeb3();
    const [supply, setSupply] = useState(0);

    // Toast alert indicating wallet authorization action requirements
    const notify = () => toast.info('Connect your wallet', {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
    });

    const provider = () => {
        const { ethereum } = window
        if (ethereum) return ethereum

        const { web3 } = window
        if (web3 && web3.currentProvider) return web3.currentProvider
    }

    // Handles global execution states on initial load configuration 
    useEffect(() => {
        getTotalSupply()
        getMintCost();
    }, []);

    // Observer loop running checks on wallet synchronization status
    useEffect(() => {
        if (walletAddress.length)
            getMintReward(walletAddress);
        else
            setMintReward(0);
    }, [walletAddress]);

    // Asynchronously queries data parameters for mint pricing parameters
    const getMintCost = async () => {
        const contract = await contractInstance;
        try {
            const res = await contract.getMintCost();
            const cost = web3.utils.fromWei(toPlainString(res), 'ether');
            setMintCost(cost);
        } catch (e) {
            createNotification('error');
        }
    }

    // Fetches the associated claim reward metrics for connected account
    const getMintReward = async (wallet) => {
        const contract = await contractInstance;
        try {
            const res = await contract.getMintReward(wallet);
            const cost = web3.utils.fromWei(toPlainString(res), 'ether');
            setMintReward(cost);
        } catch (e) {
            createNotification('error');
        }
    }

    // Pulls supply parameters from token contracts metrics
    const getTotalSupply = async () => {
        const contract = await contractInstance;
        try {
            const res = await contract.totalSupply();
            setSupply(res);
        } catch (e) {
            createNotification('error');
        }
    }

    // Triggers smart contract transactions workflow sequences
    async function mint() {
        if (walletAddress.length && count > 0) {
            const tokenContract = new web3.eth.Contract(
                tokenAbi,
                CRNT_ADDRESS
            );

            const balance = await tokenContract.methods.balanceOf(walletAddress).call();
            const balance_decimal = web3.utils.fromWei(toPlainString(balance), 'ether');

            const nftContract = new web3.eth.Contract(
                abi,
                getContractsAddress(97)
            );

            if (balance_decimal < mintCost * count) {
                toast.error('Insufficient Current balance', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                return;
            }

            const cost = web3.utils.toWei(toPlainString(parseFloat(mintCost * count).toFixed(4)), 'ether');

            try {
                await tokenContract.methods.approve(getContractsAddress(97), cost).send({
                    from: walletAddress
                });

                nftContract.methods.mint(count).send({
                    from: walletAddress
                })
                    .on('transactionHash', function (hash) {
                        const supply_num = parseInt(supply);
                        const updated = supply_num + parseInt(count);
                        setSupply((updated).toString());
                    })
            } catch (e) {
                createNotification('error');
            }
        }
        else if (count <= 0) {
            toast.info('Current amount is incorrect!', {
                position: "top-right",
                autoClose: 1000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        }
        else {
            notify();
        }
    }

    // Pipeline handling rewards settlement actions
    async function claimReward() {
        if (walletAddress.length <= 0) {
            notify();
            return;
        }
        const contract = await contractInstance;
        try {
            await contract.claimReward(walletAddress);
        } catch (e) {
            createNotification('error');
        }
    }

    // Handles fallback app notification routing UI
    function createNotification(type) {
        return () => {
            switch (type) {
                case 'info':
                    NotificationManager.info('Info message');
                    break;
                case 'success':
                    NotificationManager.success('Success message', 'Success');
                    break;
                case 'error':
                    NotificationManager.success('Invalid input parameters', 'Failed');
                    break;
                case 'wallet':
                    NotificationManager.info('Connect your wallet');
                    break;
            }
        };
    };

    return (
        <>
            {/* The main layout wrapper modified to eliminate off-screen element leakage */}
            <section className="main-section">
                <div className="row mr-0 w-100 justify-content-center">
                    {/* Balanced inline margins slightly from 50px to 30px to guarantee no scroll layout breaking */}
                    <div className="col-md-5" style={{ paddingRight: "30px", paddingLeft: "30px", marginTop: "30px" }}>
                        <div>
                            {/* Left Content Card Configuration */}
                            <div className="home-card">
                                <div className="row">
                                    <div className="col-xl-12 home-price-div">
                                        <p className="home-price-total-label">Total Current Gold&trade; Certificates to recieve:</p>
                                        <input type="number" className="home-price-input" value={count} onChange={(e) => setCount(e.target.value)} />
                                    </div>

                                    <div className="col-xl-12 home-price-div">
                                        <p className="home-price-total-label">Total Current Dollar Tokens needed:</p>
                                        <input type="text" className="home-price-total-input" value={count * mintCost} readOnly />
                                        <br/>
                                        <button className="btn btn-primary home-mint-button" data-bss-hover-animate="pulse" type="button" onClick={mint}>
                                            Redeem
                                        </button>
                                        <br></br> <br></br> <br></br>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-md-5 p-50-mt-50">
                        <div>
                            {/* Right Content Card Configuration */}
                            <div className="home-card">
                                <div className="row">
                                    <div className="col-xl-12 text-center-with-padding-50" style={{ marginBottom: "40px", marginTop: "0px" }}>
                                        <br></br>
                                        <h1 className="home-earned"> Current Vault&trade;</h1>
                                        <br/>
                                        <h1 className='home-earned-value'>
                                            {mintReward} Rewards </h1>
                                    </div>
                                    <div className="col-xl-12 text-center-with-padding-50" style={{ marginBottom: "-11px", height: "50px" }}>
                                        <button className="btn btn-primary home-claim-button" data-bss-hover-animate="pulse" type="button" onClick={claimReward}>Claim</button>
                                    </div>
                                    <div className="col-xl-12" style={{ textAlign: "center" }}>
                                        <p className="home-marketing-banner">Holders earn Current&trade;</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <ToastContainer
                position="top-right"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </>
    );
};