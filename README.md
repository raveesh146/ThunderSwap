# ThunderSwap DApp - Cross-Chain Token Swap 🚀😋

This repository contains the code for **ThunderSwap**, a decentralized application (DApp) that allows users to swap tokens seamlessly across different blockchain networks. The DApp leverages the **0x Swap API** for executing token swaps and fetches token lists and real-time prices from **Coingecko.com**. JavaScript modules are bundled using **Browserify**, which includes the following dependencies: **qs**, **web3**, and **bignumber.js** for query string parsing, blockchain interaction, and handling large numbers, respectively.

---

## 🔧 Technologies Used

- **0x Swap API**: Facilitates token swaps across blockchain networks.
- **Coingecko.com**: Provides real-time token lists and prices.
- **qs**: Query string parsing.
- **web3.js**: Blockchain interaction for Ethereum-based networks.
- **bignumber.js**: For handling large numbers in JavaScript.
- **Browserify**: JavaScript bundler to manage dependencies and create a single bundle.

---

## 📁 Repository Structure

- **`index.js`**: Main JavaScript file containing the DApp logic for token swapping and blockchain interaction.
- **`index.html`**: HTML file that defines the structure of the DApp's frontend.
- **`style.css`**: CSS file for styling the DApp.
- **`/assets`**: Folder containing image assets used in the DApp.

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

Clone the repository to your local machine using the following command:

```bash
git clone https://github.com/raveesh146/ThunderSwap
cd ThunderSwap
```

### 2. Install Dependencies
```
npm install browserify qs web3 bignumber.js

```

### 3. Bundle JavaScript Files
```
browserify index.js -o bundle.js
```

**License** 

This project is licensed under the MIT License - see the LICENSE file for details
