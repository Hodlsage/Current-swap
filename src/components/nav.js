import React, {useEffect} from 'react';
import {Link, useLocation} from "react-router-dom";

// Import button component
import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnect from "@walletconnect/web3-provider";
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import useWeb3 from "./useWeb3";
import './nav.css';


const getProviderOptions = () => { // const infuraId = "00ca1859789d4b40bce01f4104844224";
    const providerOptions = {
        walletconnect: {
            package: WalletConnect,
            options: {
                network: "binance",
                rpc: {
                    56: "https://bsc-dataseed1.binance.org"
                }
            }
        },
        coinbasewallet: {
            package: CoinbaseWalletSDK, // Required
            options: {
                appName: "Current Network", // Required
                infuraId: "", // Required
                rpc: "https://bsc-dataseed1.binance.org", // Optional if `infuraId` is provided; otherwise it's required
                chainId: 56, // Optional. It defaults to 1 if not provided
                darkMode: false // Optional. Use dark theme, defaults to false
            }
        },
        "custom-binancechainwallet": {
            display: {
                logo: "https://lh3.googleusercontent.com/rs95LiHzLXNbJdlPYwQaeDaR_-2P9vMLBPwaKWaQ3h9jNU7TOYhEz72y95VidH_hUBqGXeia-X8fLtpE8Zfnvkwa=w128-h128-e365-rj-sc0x00ffffff",
                name: "Binance Chain Wallet",
                description: "Connect to your Binance Chain Wallet"
            },
            package: true,
            connector: async () => {
                let provider = null;
                if (typeof window.BinanceChain !== 'undefined') {
                    provider = window.BinanceChain;
                    try {
                        const account = await provider.request({method: 'eth_requestAccounts'})
                        console.log(account[0]);
                    } catch (error) {
                        throw new Error("User Rejected");
                    }
                } else {
                    throw new Error("No Binance Chain Wallet found");
                }
                return provider;
            }
        }
    };
    return providerOptions;
};


export const Nav = () => {
    const location = useLocation();
    const {web3, setWeb3, walletAddress, setWalletAddress} = useWeb3();

    const web3Modal = new Web3Modal({network: "Binance", cacheProvider: true, providerOptions: getProviderOptions()});

    useEffect(() => {
        if (web3Modal.cachedProvider) {
            resetApp();
        }
    }, []);

    const subscribeProvider = async (provider) => {
        if (!provider.on) {
            return;
        }
        provider.on("close", () => resetApp());
        provider.on("accountsChanged", async (accounts) => {
            console.log(accounts[0]);
            setWalletAddress(accounts[0]);
            // setWeb3Data({ ...web3Data, address: accounts[0] });
            // await this.getAccountAssets();
        });
        provider.on("chainChanged", async (chainId) => {
            // const { web3 } = web3Data;
            // const networkId = await web3.eth.net.getId();
            // setWeb3Data({ ...web3Data, chainId: chainId, networkId: networkId });
            // await this.getAccountAssets();
        });

        provider.on("networkChanged", async (networkId) => {
            // const { web3 } = web3Data;
            // const chainId = await web3.eth.chainId();
            // setWeb3Data({ ...web3Data, chainId: chainId, networkId: networkId });
            // await this.getAccountAssets();
        });
    };

    const resetApp = async () => { // const { web3 } = web3Data;
        if (web3 && web3.currentProvider && web3.currentProvider.close) {
            await web3.currentProvider.close();
        }
        setWalletAddress("");
        await web3Modal.clearCachedProvider();
        // setWeb3Data({ ...INITIAL_STATE });
    };

    const onDisconnect = async () => {
        try {
            await resetApp();
        } catch (e) {
            console.log(e);
        }
    };

    const onConnect = async () => {
        try {
            const provider = await web3Modal.connect();
            await subscribeProvider(provider);
            await provider.enable();
            setWeb3(new Web3(provider));
            const chainId = await provider.request({method: 'eth_chainId'});
            // const binanceTestChainId = '0x38'
            const binanceTestChainId = '0x61'
            if (chainId === binanceTestChainId) {
                console.log("Bravo!, you are on the correct network");
            } else {
                try {
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [
                            {
                                chainId: '0x61'
                                // chainId: '0x38'
                            }
                        ]
                    });
                    console.log("You have succefully switched to Binance main network")
                } catch (switchError) { // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902) {
                        try {
                            await provider.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: '0x61',
                                        chainName: 'Smart Chain - Testnet',
                                        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                                        blockExplorerUrls: ['https://testnet.bscscan.com'],
                                        // chainId: '0x38',
                                        // chainName: 'Binance Smart Chain',
                                        // rpcUrls: ['https://bsc-dataseed1.binance.org'],
                                        // blockExplorerUrls: ['https://bscscan.com/'],
                                        nativeCurrency: {
                                            symbol: 'BNB',
                                            decimals: 18
                                        }
                                    }
                                ]
                            });
                        } catch (addError) {
                            console.log(addError);
                            // alert(addError);
                        }
                    }
                    // alert("Failed to switch to the network")
                    return;
                }
            }

            const accounts = await provider.request({method: 'eth_requestAccounts'});
            const account = accounts[0];
            setWalletAddress(account);
        } catch (e) {
            console.log(e);
        }
    };

        onConnect();
   
  

    function ellipseAddress(address = "", width = 10) {
        return `${
            address.slice(0, width)
        }...${
            address.slice(- width)
        }`;
    }

    return  (

        
        <header className="nav-header">
            <nav className="navbar navbar-dark navbar-expand-md py-3 nav-background">
                <div className="container">
                    <Link className="navbar-brand d-flex align-items-center" to="/">
                    <img src="../img/currentforbg-sm.png" size="10" />
                    </Link>
                    <button data-bs-toggle="collapse" className="navbar-toggler nav-button" data-bs-target="#navcol-1">
                        <span className="visually-hidden">Toggle navigation</span>
                        <span className="navbar-toggler-icon"
                            style={
                                {color: "var(--bs-yellow)"}
                        }></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navcol-1">
                        <ul className="navbar-nav me-auto"></ul>
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <Link to="/"
                                    className={
                                        `nav-link nav-tab ${
                                            location.pathname === "/" ? "active" : ""
                                        }`
                                }>Current Gold™ Token&reg;</Link>
                            </li>
                        </ul>
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <Link to="/vault"
                                    className={
                                        `nav-link nav-tab ${
                                            location.pathname === "/vault" ? "active" : ""
                                        }`
                                }>Current Gold™Vault&trade;</Link>
                            </li>
                        </ul>
                        <br/>
                        <button className="connect-wallet" data-bss-hover-animate="pulse" type="button"
                            onClick={
                                walletAddress === "" ? onConnect : resetApp
                        }>
                            {
                            walletAddress === "" ? "Connect Wallet" : ellipseAddress(walletAddress)
                        }</button>
                        {
                        walletAddress !== "" && (
                            <button className="connect-wallet" data-bss-hover-animate="pulse" type="button"
                                onClick={onDisconnect}>
                                Disconnect Wallet
                            </button>
                        )
                    } </div>
                </div>
            </nav>
        </header>
    ); 
    //return resetApp;

    
     
    
    
};

