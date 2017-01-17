## Mewify: No more syncing the chain.
##### A project by MyEtherWallet.



## Warnings
- **This project is in ALPHA. Use at your own risk. Do not expect it to work.**
- This is a brand-spanking-new project. Please do not place any keys with larges amounts into your new mewify keystore folder.
- This has not been tested on Windows. Feel free to give it a go, but it may not work.
- Please only use this if you are able

##If you have a problem
- Please open a github issue.
    - *tayvano is now spending ~2hrs / day on support requests that come in on every platform. While MEW users love it when she's up at 5am, her client's hate it when she falls asleep on a call.*
- So, pretty please: open a github issue. 😃
- If possible, we would LOVE you if you could include the following in your issue:
    - your OS
    - OS version
    - What you are trying to connect to (mist, ethereum wallet, other?)
    - Red messages in (right click anywhere in Mewify and click "Inspect")
    - Warnings in terminal
    - Warnings that are displayed via terminal-notifier.
    - What you were doing and/or trying to do when this happened. e.g...
        - I opened the app up and it died 😞.
        - I tried to send a transaction and it hung.
        - I successfully sent a transaction but now my computer turned into a dragon and attacked me. Here is the TX ID as a link to etherscan.io because even though I'm being attacked by a rabid computer-dragon, I still understand how much easier it makes your life when I give you links.
- We will be better at providing full support users we squash all these pesky bugs. Until then, don't piss off tayvano and put everything in --->>> ** GITHUB ISSUES, PLEEEEEASE! ** <<<-----


## Getting up and running
- Install Node (w/ npm)
- We are running Node v7.4. It should work with older version but if you are getting errors, try updating node first.
- You can update also update node via npm:
    - `sudo npm cache clean -f`
    - `sudo npm install -g n`
    - `sudo n stable`
    - `sudo npm update -g`
- If you need specific versions of node for different projects, get `nvm`. Seriously. Then it's as simple as `nvm install 7.4` & `nvm use 7.4`
- Install nw.js globally:
    - `sudo npm install nw --nwjs_build_type=sdk -g`
    - *TODO: see if we can do this automagically? I don't think so because global?*
- Clone / download the Mewify repo
- `cd path/to/folder`
- run `npm install`
- run `gulp`
- run `npm start`
- Mewify should automatically open up.
- Mewify should **NOT** have empty fields & 3 buttons showing. If it does, it's not working properly.
- Click the "Start" button

## Interacting with Dapps in Ethereum Wallet / Mist
- Get it up and running (see above)
- Open Mist or Ethereum Wallet
- Your chain should be fully synced after a couple seconds.
- Create a new account. Your chain should be already fully synced.
- In order to use your existing keys, copy and paste them to the key folder that is shown under "Keystore Location" in Mewify. They should now show up in Mist/EW.
- **Note: Please don't move keys into this folder or change to use your default keystore folder further testing has been done.**


## Interacting with Dapps in Chrome (? does this work ?)
- Get it up and running (see above)
- Open that page in Chrome
- Interact and try to send transaction
- Enter the **incorrect** password in your browser!! (This makes it so you don't have to trust the dapp / your browser! 😃)
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
