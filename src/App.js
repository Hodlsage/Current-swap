import "./App.css";
import { useState, useEffect } from "react";
import connectContract, { contract } from "./connectContract";
import Swal from "sweetalert2";
import { ethers } from "ethers";
import PulseLoader from "react-spinners/PulseLoader";
import ScaleLoader from "react-spinners/ScaleLoader";

function App() {
     
     const [isOwner, setIsOwner] = useState(false);
     const [loading, setLoading] = useState(false);
     const [txnloading, setTxnLoading] = useState(false);
     const [userEthBalance, setUserEthBalance] = useState(0);
     const [userErc20Balance, setUserErc20Balance] = useState(0);
     const [account, setAccount] = useState(false);
     const [value1, setValue1] = useState();
     const [value2, setValue2] = useState();
     const [rate, setRate] = useState(0);
     const [chainId, setChainId] = useState("");
     const [raiseAmount, setRaiseAmount] = useState(0);
     useEffect(() => {
          setLoading(true);
          if (account) {
               
               async function fetchBalance(account) {
                    try {
                         const provider = ethers.getDefaultProvider('https://rpc-mumbai.maticvigil.com/');
                         const balance = await provider.getBalance(account);
                         
                         return balance;
                    } catch (error) {
                         console.error("Error fetching balance:", error);
                    }
                    
               }
               fetchBalance(account).then((res) => {
                    const balString = ethers.utils.formatEther(res);
                    const balance = Number(balString);
                    const bal = balance.toFixed(2);
                    setUserEthBalance(bal);
                    setLoading(false);
                    console.log("eth:",bal);
                    
               });

               async function fetchErc20(account){
                    try{
                         const balance = await contract.checkERC20Balance(account);
                         console.log("balance:", balance.toNumber()/100);
                         setUserErc20Balance(balance.toNumber()/100);
                         return balance.toNumber();
                    }
                    catch(error){
                         console.error("Error fetching balance:", error);
                    }
               }
                fetchErc20(account);
               
               
               
    
          }
     }, [account,txnloading]);
     
     useEffect(() => {
          const { ethereum } = window;
          const checkChain = async() =>{
               const chainId = await ethereum.request({ method: 'eth_chainId' });
               setChainId(chainId);
               if(chainId!=="0x13881"){
                    Swal.fire({
                         icon: "error",
                         title: "Wrong Network",
                         text: "Please connect to Mumbai Testnet",
                    });
                    
               }
          }
          checkChain();
          window.ethereum.on('chainChanged', (chainId) => {
               checkChain();
          });
     },[account])

     //connect to metamask
     const { ethereum } = window;
     const connectMetamask = async () => {
          const chainId = await ethereum.request({ method: 'eth_chainId' });
          setChainId(chainId);
          if(chainId!=="0x13881"){
               Swal.fire({
                    icon: "error",
                    title: "Wrong Network",
                    text: "Please connect to Mumbai Testnet",
               });
          }
          else{
               if (window.ethereum !== undefined) {
                    const accounts = await ethereum.request({
                         method: "eth_requestAccounts",
                    });
                    setAccount(accounts[0]);
                    
               }
          }
     };

     //connect to contract
     connectContract();

     //swap
     async function handleSwap() {
          setTxnLoading(true);
          if(chainId!=="0x13881"){
               setTxnLoading(false);
               Swal.fire({
                    icon: "error",
                    title: "Wrong Network",
                    text: "Please connect to Mumbai Testnet",
               });
          }
          else{
          try {
               console.log("value1 : ", value1);
               const etherValue = ethers.utils.parseEther(value1);

               console.log(
                    "etherValue : ",
                    ethers.utils.formatEther(etherValue)
               );
               const reciept = await contract.buy({
                    value: etherValue,
               });
               await reciept.wait();
               console.log("reciept : ", reciept);
               const owner = await contract.OWNER();
               const rate = await contract.RATE();
               const remainingTokens = await contract.remainingFund();
               console.log(
                    "Data : ",
                    owner,
                    ethers.utils.formatEther(rate),
                    ethers.utils.formatEther(remainingTokens)
               );
               setTxnLoading(false);
               Swal.fire({
                    icon: "success",
                    title: "Transaction Sucessful",
                    text: `You got token worth of ${ethers.utils.formatEther(
                         etherValue
                    )} ETH`,
                    footer: `<a href="https://mumbai.polygonscan.com/tx/${reciept.hash}" target="_blank">Check the transaction hash on Ethersan</a>`,
               });
          } catch (error) {
               setTxnLoading(false);
               Swal.fire({
                    icon: "error",
                    title: "Transaction Details",
                    text: error.reason||error.data.message,
               });
          }
          }
          setLoading(false);
     }

     //getting rate from contract
     async function getRate() {
          if(rate===0)
          {
               try {
               const rate = await contract.RATE();
               setRate(rate.toNumber());
          } catch (error) {
               console.log("error : ", error);
          }}
     }
     getRate();

     //handle input
     function handleValue1(event){
          const newValue = event.target.value;
          setValue1(newValue);
          setValue2(newValue*rate);
     }
     function handleValue2(event){
          const newValue = event.target.value;
          setValue2(newValue);
          setValue1(String(newValue/rate));
     }

     //check raise amount
     async function checkRaiseAmount() {
          const raisedEth = await contract.raisedEth();
          const balString = ethers.utils.formatEther(raisedEth);
          console.log("raisedEth : ",balString);
          setRaiseAmount(balString);
     }
     checkRaiseAmount();
     


     return (
          <div className="App">
               <header className="nevbar">
                    <span></span>
                    <h1>Swap Current for USG</h1>
                    <button onClick={connectMetamask}>
                         {account
                              ? `${account.substring(
                                     0,
                                     3
                                )}....${account.substring(
                                     account.length - 3,
                                     account.length
                                )}`
                              : "Connect "}
                    </button>{" "}
               </header>

               <div className="container">
                         <div >
                              <h2 className="value"> total CENT per USG : {raiseAmount} CENT </h2>
                         </div>
                         <div className="box">
                              <h2> Current Swap </h2>
                              <div className="minibox1">
                                   <button>CENT</button>
                                   <input
                                        type="number"
                                        value={value1}
                                        className="form-input"
                                        placeholder="0"
                                        onChange={(event) =>
                                             handleValue1(event)
                                        }
                                   />
                              </div>
                              <div className="minibox1">
                                   <button>USG</button>
                                   <input
                                        type="number"
                                        value={value2}
                                        className="form-input"
                                        placeholder="0"
                                        onChange={(event) =>
                                             handleValue2(event)
                                        }
                                   />
                              </div>
                              <div className="minibox3">
                                   <h4>Your Balances</h4>
                                   <br />
                                   <div className="para">
                                        <p>{loading?<PulseLoader
                                             color="#83909c"
                                             loading = {loading}
                                             />:`${userEthBalance} CENT`}</p>
                                        <p>{loading?<PulseLoader
                                             color="#83909c"
                                             loading = {loading}
                                             />:`${userErc20Balance} USG`}</p>
                                   </div>
                              </div>
                              <div className="minibox4">
                                   {txnloading?<ScaleLoader
                                             color="#83909c"
                                             loading = {txnloading}
                                             />:
                                   <button disabled={txnloading} onClick={handleSwap}>Swap</button>}
                                   {isOwner && <button>RemainingFund</button>}
                              </div>
                         </div>
                    
               </div>

          
          </div>
     );
}

export default App;
