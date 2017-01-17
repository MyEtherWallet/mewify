## Mewify: An Ethereum Client by MyEtherWallet

## Warnings
- This is a brand-spanking-new project. Please do not place any keys with larges amounts into your new mewify keystore folder.
- This has not been tested on Windows. Feel free to give it a go but it may not work.

## Developers

- Install Node (w/ NPM)
- Make sure you are using node v7.4 (or greater). To update node via npm:
    - `sudo npm cache clean -f`
    - `sudo npm install -g n`
    - `sudo n stable`
- Install nw.js globally:
    - `sudo npm install nw --nwjs_build_type=sdk -g`
- Clone / download the Mewify repo
- `cd path/to/folder`
- run `npm install`
- run `gulp`
- run `npm start`
- Mewify should automatically open up.
- Click "start"

## Interacting with Dapps in Ethereum Wallet / Mist
- Open Mist or Ethereum Wallet
- Create a new account. Your chain should be already fully synced.
- In order to use your existing keys, copy and paste them to the key folder that is shown under "Keystore Location" in Mewify. They should now show up in Mist/EW.
- **Note: Please don't move keys into this folder or change to use your default keystore folder further testing has been done.**


## Interacting with Dapps in (not-Mist) Chrome
- Open that page in Chrome
- Interact and try to send transaction
- Enter the **incorrect** password in your browser!! (This makes it so you don't have to trust the dapp / your browser)
- Mewify will show confirmation screen
- Enter **correct** password in Mewify
- Confirm transaction


## Contact Us
- Created & Maintained by [kvhnuke](https://github.com/kvhnuke) and [tayvano](https://github.com/tayvano)
- [MyEtherWallet on Github](https://github.com/MyEtherWallet)
- [MyEtherWallet.com on Github](https://github.com/kvhnuke/etherwallet)
- [MyEtherAPI on Github](https://github.com/MyEtherWallet/myetherapi)
- [Mewify on Github](https://github.com/MyEtherWallet/Mewify)

---

**Mewify is licensed under The MIT License (MIT).**
