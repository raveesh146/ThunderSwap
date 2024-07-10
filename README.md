This repository contains the code for a decentralized application (DApp) that allows users to swap tokens across different blockchain networks using the 0x Swap API and fetches token lists from Coingecko.com . Browserify is used to bundle JavaScript modules, including qs, web3, and bignumber.js

Technologies Used:

0x Swap API: For executing token swaps.
Coingecko.com: Provides token lists and real-time prices.
Modules: qs, web3, bignumber.js for query string parsing, blockchain interaction, and handling large numbers.
Browserify: JavaScript bundler for managing dependencies.

Repository Structure:

index.js: Main JavaScript file for DApp logic.
index.html: HTML file for DApp structure.
style.css: CSS file for styling.
/assets: Folder containing image assets.

Setup Instructions:

 1. Clone the repository:
git clone https://github.com/raveesh146/ThunderSwap
cd cross-chain-token-swap-dapp

2. Install dependencies:
 npm install browserify qs web3 bignumber.js

3. Bundle JavaScript modules
 browserify index.js -o bundle.js
