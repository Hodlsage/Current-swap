const ganache = require("ganache");
const { ethers } = require("ethers");
const fs = require("fs");
const C = JSON.parse(fs.readFileSync("Current.json"));

let passCount = 0, failCount = 0;
const ok = (m) => { console.log("  \u2713", m); passCount++; };
const bad = (m) => { console.log("  \u2717 FAIL:", m); failCount++; };
async function expectRevert(fn, label) {
  try { const tx = await fn(); await tx.wait(); bad(`${label} — expected revert, succeeded`); }
  catch (e) { ok(`${label} — reverted as expected`); }
}

(async () => {
  const server = ganache.server({ logging:{quiet:true}, wallet:{totalAccounts:5, defaultBalance:100} });
  await server.listen(8550);
  const provider = new ethers.providers.Web3Provider(server.provider);
  const a = await provider.listAccounts();
  const [deployer, alice, bob, vault, attacker] = a.map((_,i)=>provider.getSigner(i));
  const [dAddr, aliceA, bobA, vaultA, atkA] = a;

  console.log("=== Current (CRNT) — security & functional test suite ===\n");

  const crnt = await new ethers.ContractFactory(C.abi, C.bytecode, deployer).deploy(1000);
  await crnt.deployed();

  // --- Metadata / atomicity ---
  console.log("--- metadata & atomicity ---");
  (await crnt.name()) === "Current" ? ok("name = Current") : bad("name");
  (await crnt.symbol()) === "CRNT" ? ok("symbol = CRNT") : bad("symbol");
  (await crnt.decimals()) === 0 ? ok("decimals = 0 (ATOMIC)") : bad("decimals");
  (await crnt.totalSupply()).toNumber() === 1000 ? ok("initial supply = 1000 to deployer") : bad("supply");
  (await crnt.balanceOf(dAddr)).toNumber() === 1000 ? ok("deployer holds 1000") : bad("deployer bal");

  // --- roles set at deploy ---
  console.log("\n--- roles ---");
  (await crnt.owner()) === dAddr ? ok("deployer is owner") : bad("owner");
  (await crnt.isMinter(dAddr)) ? ok("deployer is minter") : bad("minter");
  (await crnt.isPauser(dAddr)) ? ok("deployer is pauser") : bad("pauser");

  // --- mint access control ---
  console.log("\n--- mint access control ---");
  await expectRevert(() => crnt.connect(alice).mint(aliceA, 100), "non-minter mint");
  await (await crnt.connect(deployer).mint(aliceA, 500)).wait();
  (await crnt.balanceOf(aliceA)).toNumber() === 500 ? ok("owner/minter minted 500 to alice") : bad("mint");

  // grant vault minter (gold-backed issuance path)
  await (await crnt.connect(deployer).setMinter(vaultA, true)).wait();
  await (await crnt.connect(vault).mint(bobA, 250)).wait();
  (await crnt.balanceOf(bobA)).toNumber() === 250 ? ok("granted vault minter; vault minted 250 to bob") : bad("vault mint");

  // --- transfers ---
  console.log("\n--- transfers ---");
  await (await crnt.connect(alice).transfer(bobA, 200)).wait();
  (await crnt.balanceOf(bobA)).toNumber() === 450 ? ok("alice transferred 200 to bob") : bad("transfer");
  await expectRevert(() => crnt.connect(alice).transfer(bobA, 10000), "transfer over balance");

  // --- allowance + transferFrom ---
  console.log("\n--- allowance & transferFrom ---");
  await (await crnt.connect(bob).approve(aliceA, 100)).wait();
  (await crnt.allowance(bobA, aliceA)).toNumber() === 100 ? ok("bob approved alice 100") : bad("approve");
  await (await crnt.connect(alice).transferFrom(bobA, aliceA, 60)).wait();
  (await crnt.allowance(bobA, aliceA)).toNumber() === 40 ? ok("allowance decremented to 40") : bad("allowance dec");
  await expectRevert(() => crnt.connect(alice).transferFrom(bobA, aliceA, 1000), "transferFrom over allowance");

  // infinite allowance not decremented
  const MAX = ethers.constants.MaxUint256;
  await (await crnt.connect(bob).approve(aliceA, MAX)).wait();
  await (await crnt.connect(alice).transferFrom(bobA, aliceA, 5)).wait();
  (await crnt.allowance(bobA, aliceA)).eq(MAX) ? ok("infinite allowance not decremented") : bad("infinite allowance");

  // increase/decrease allowance
  await (await crnt.connect(alice).approve(bobA, 0)).wait();
  await (await crnt.connect(alice).increaseAllowance(bobA, 30)).wait();
  await (await crnt.connect(alice).decreaseAllowance(bobA, 10)).wait();
  (await crnt.allowance(aliceA, bobA)).toNumber() === 20 ? ok("increase/decreaseAllowance ok") : bad("inc/dec");
  await expectRevert(() => crnt.connect(alice).decreaseAllowance(bobA, 9999), "decrease below zero");

  // --- burn ---
  console.log("\n--- burn ---");
  const supplyBefore = (await crnt.totalSupply()).toNumber();
  await (await crnt.connect(bob).burn(50)).wait();
  (await crnt.totalSupply()).toNumber() === supplyBefore - 50 ? ok("burn reduced supply") : bad("burn supply");
  await expectRevert(() => crnt.connect(bob).burn(99999), "burn over balance");

  // burnFrom (minter only)
  await (await crnt.connect(alice).approve(dAddr, 30)).wait();
  await (await crnt.connect(deployer).burnFrom(aliceA, 30)).wait();
  ok("minter burnFrom with allowance ok");
  await (await crnt.connect(bob).approve(atkA, 10)).wait();
  await expectRevert(() => crnt.connect(attacker).burnFrom(bobA, 10), "non-minter burnFrom");

  // --- pause ---
  console.log("\n--- pause control ---");
  await expectRevert(() => crnt.connect(attacker).setPaused(true), "non-pauser pause");
  await (await crnt.connect(deployer).setPaused(true)).wait();
  (await crnt.paused()) ? ok("owner paused") : bad("paused state");
  await expectRevert(() => crnt.connect(alice).transfer(bobA, 1), "transfer while paused");
  await expectRevert(() => crnt.connect(deployer).mint(aliceA, 1), "mint while paused");
  await (await crnt.connect(deployer).setPaused(false)).wait();
  await (await crnt.connect(alice).transfer(bobA, 1)).wait();
  ok("transfer resumes after unpause");

  // --- freeze ---
  console.log("\n--- address freeze (compliance) ---");
  await expectRevert(() => crnt.connect(attacker).setFrozen(aliceA, true), "non-pauser freeze");
  await (await crnt.connect(deployer).setFrozen(aliceA, true)).wait();
  (await crnt.isFrozen(aliceA)) ? ok("alice frozen") : bad("freeze");
  await expectRevert(() => crnt.connect(alice).transfer(bobA, 1), "frozen sender cannot send");
  await expectRevert(() => crnt.connect(bob).transfer(aliceA, 1), "frozen recipient cannot receive");
  await (await crnt.connect(deployer).setFrozen(aliceA, false)).wait();
  await (await crnt.connect(alice).transfer(bobA, 1)).wait();
  ok("unfreeze restores transfers");

  // --- two-step ownership ---
  console.log("\n--- two-step ownership transfer ---");
  await (await crnt.connect(deployer).transferOwnership(aliceA)).wait();
  (await crnt.owner()) === dAddr ? ok("owner unchanged until accepted") : bad("premature owner change");
  (await crnt.pendingOwner()) === aliceA ? ok("pendingOwner = alice") : bad("pendingOwner");
  await expectRevert(() => crnt.connect(bob).acceptOwnership(), "non-pending cannot accept");
  await (await crnt.connect(alice).acceptOwnership()).wait();
  (await crnt.owner()) === aliceA ? ok("alice accepted ownership") : bad("accept");
  // give it back for cleanliness
  await (await crnt.connect(alice).transferOwnership(dAddr)).wait();
  await (await crnt.connect(deployer).acceptOwnership()).wait();
  ok("ownership returned to deployer");

  // --- zero-address guards ---
  console.log("\n--- zero-address & edge guards ---");
  await expectRevert(() => crnt.connect(deployer).transfer(ethers.constants.AddressZero, 1), "transfer to zero");
  await expectRevert(() => crnt.connect(deployer).setMinter(ethers.constants.AddressZero, true), "setMinter zero");

  // --- renounce guard ---
  console.log("\n--- renounce ownership guard ---");
  await expectRevert(() => crnt.connect(deployer).renounceOwnership(ethers.utils.formatBytes32String("wrong")), "renounce with bad confirmation");

  await server.close();
  console.log(`\n=== RESULT: ${passCount} passed, ${failCount} failed ===`);
  process.exit(failCount === 0 ? 0 : 1);
})().catch(e => { console.error("FATAL:", e); process.exit(1); });
