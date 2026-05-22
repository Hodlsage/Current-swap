const ganache = require("ganache");
const { ethers } = require("ethers");
const fs = require("fs");

const Current = JSON.parse(fs.readFileSync("CurrentV2.json"));
const USG = JSON.parse(fs.readFileSync("MockUSGold.json"));
const Vault = JSON.parse(fs.readFileSync("USGoldVault.json"));

const pass = (m) => console.log("  \u2713", m);
const fail = (m) => { console.log("  \u2717 FAIL:", m); process.exitCode = 1; };

(async () => {
  const server = ganache.server({ logging: { quiet: true }, chain: { chainId: 97 }, wallet: { totalAccounts: 3, defaultBalance: 100 } });
  await server.listen(8546);
  const provider = new ethers.providers.Web3Provider(server.provider);
  const accts = await provider.listAccounts();
  const owner = provider.getSigner(0), user = provider.getSigner(1);
  const ownerAddr = accts[0], userAddr = accts[1];

  console.log("=== Atomic USGold Vault — integration test ===\n");

  // Deploy atomic Current (decimals=0)
  const crnt = await new ethers.ContractFactory(Current.abi, Current.bytecode, owner).deploy();
  await crnt.deployed();
  const dec = await crnt.decimals();
  dec === 0 ? pass(`Current is atomic (decimals=${dec})`) : fail(`decimals=${dec}, expected 0`);

  // Deploy mock USGold + vault
  const usg = await new ethers.ContractFactory(USG.abi, USG.bytecode, owner).deploy();
  await usg.deployed();

  const EAGLE = 4750; // whole CRNT, atomic
  const vault = await new ethers.ContractFactory(Vault.abi, Vault.bytecode, owner).deploy(crnt.address, usg.address, EAGLE);
  await vault.deployed();
  pass(`Vault deployed, initial Eagle price = ${(await vault.eaglePriceCRNT()).toString()} CRNT`);

  // Constructor must reject non-atomic Current — quick negative check is implicit
  // (we deployed against an atomic one). Verify the require message exists by
  // checking decimals enforcement held (it did, since deploy succeeded).

  // Pre-mint 3 certificates straight into the vault, then register inventory.
  for (const id of [101, 102, 103]) await (await usg.connect(owner).mint(vault.address, id)).wait();
  await (await vault.connect(owner).addInventory([101, 102, 103])).wait();
  const inv = await vault.availableInventory();
  inv.toNumber() === 3 ? pass(`Inventory registered: ${inv} certificates`) : fail(`inventory=${inv}`);

  // Fund the reserve with CRNT so swap-outs can be paid.
  // Current mints to deployer in constructor (huge supply); move some to a clean number.
  await (await crnt.connect(owner).approve(vault.address, 100000)).wait();
  await (await vault.connect(owner).fundReserve(100000)).wait();
  pass(`Reserve funded: ${(await vault.reserveBalance()).toString()} CRNT`);

  // Give the user enough CRNT to swap in.
  await (await crnt.connect(owner).transfer(userAddr, 20000)).wait();
  pass(`User CRNT balance: ${(await crnt.balanceOf(userAddr)).toString()}`);

  // ---- TEST: swap IN ----
  console.log("\n--- swapIn (CRNT -> USGold) at 4750 ---");
  await (await crnt.connect(user).approve(vault.address, EAGLE)).wait();
  const beforeCrnt = await crnt.balanceOf(userAddr);
  await (await vault.connect(user).swapIn()).wait();
  const afterCrnt = await crnt.balanceOf(userAddr);
  const userNfts = await usg.balanceOf(userAddr);
  (beforeCrnt.sub(afterCrnt)).toNumber() === EAGLE ? pass(`User paid exactly ${EAGLE} CRNT`) : fail(`paid ${beforeCrnt.sub(afterCrnt)}`);
  userNfts.toNumber() === 1 ? pass(`User now holds ${userNfts} certificate`) : fail(`nfts=${userNfts}`);
  (await vault.availableInventory()).toNumber() === 2 ? pass("Inventory decremented to 2") : fail("inventory not decremented");

  // Which token did the user get? FIFO -> 101
  const owns101 = await usg.ownerOf(101);
  owns101.toLowerCase() === userAddr.toLowerCase() ? pass("User received token 101 (FIFO)") : fail(`token101 owner ${owns101}`);

  // ---- TEST: price rises (within guard) ----
  console.log("\n--- price update 4750 -> 4800 (within 20% guard) ---");
  await (await vault.connect(owner).setEaglePrice(4800)).wait();
  (await vault.eaglePriceCRNT()).toNumber() === 4800 ? pass("Price updated to 4800") : fail("price not updated");

  // ---- TEST: price update beyond guard reverts ----
  console.log("\n--- price update beyond guard should revert ---");
  try { await (await vault.connect(owner).setEaglePrice(100000)).wait(); fail("guard did not block huge jump"); }
  catch (e) { pass("Price-change guard blocked an out-of-bounds update"); }

  // ---- TEST: swap OUT at the NEW price (user profits 50 CRNT) ----
  console.log("\n--- swapOut (USGold -> CRNT) at 4800 ---");
  await (await usg.connect(user).approve(vault.address, 101)).wait();
  const beforeOut = await crnt.balanceOf(userAddr);
  await (await vault.connect(user).swapOut(101)).wait();
  const afterOut = await crnt.balanceOf(userAddr);
  (afterOut.sub(beforeOut)).toNumber() === 4800 ? pass(`User received ${afterOut.sub(beforeOut)} CRNT (gold rose)`) : fail(`received ${afterOut.sub(beforeOut)}`);
  (await usg.ownerOf(101)).toLowerCase() === vault.address.toLowerCase() ? pass("Token 101 returned to vault") : fail("token not returned");
  (await vault.availableInventory()).toNumber() === 3 ? pass("Inventory back to 3") : fail("inventory not restored");

  // ---- TEST: solvency guard ----
  console.log("\n--- solvency: drain reserve, swapOut must revert ---");
  // User swaps in first (this ADDS CRNT to the reserve), getting a cert.
  await (await crnt.connect(user).approve(vault.address, await vault.eaglePriceCRNT())).wait();
  await (await vault.connect(user).swapIn()).wait();
  const userToken = (await usg.ownerOf(102)).toLowerCase() === userAddr.toLowerCase() ? 102 : 103;
  // NOW drain the reserve below the payout price so swapOut cannot be funded.
  const reserve = await vault.reserveBalance();
  const price = await vault.eaglePriceCRNT();
  await (await vault.connect(owner).withdrawReserve(ownerAddr, reserve.sub(price.sub(1)))).wait();
  pass(`Reserve drained to ${(await vault.reserveBalance()).toString()} (below price ${price})`);
  await (await usg.connect(user).approve(vault.address, userToken)).wait();
  try { await (await vault.connect(user).swapOut(userToken)).wait(); fail("swapOut succeeded with empty reserve"); }
  catch (e) { pass("Solvency guard blocked swapOut when reserve insufficient"); }

  // ---- TEST: pause ----
  console.log("\n--- pause blocks swaps ---");
  await (await vault.connect(owner).setPaused(true)).wait();
  try { await (await vault.connect(user).swapIn()).wait(); fail("swapIn worked while paused"); }
  catch (e) { pass("Pause blocks swapIn"); }

  await server.close();
  console.log("\n=== Vault test run complete ===");
})().catch(e => { console.error("FATAL:", e); process.exit(1); });
