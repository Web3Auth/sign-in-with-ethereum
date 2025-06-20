import { Header, Payload, SIWEthereum } from "@web3auth/sign-in-with-ethereum";
import React, { useState } from "react";
import Swal from "sweetalert2";
import { ethers } from "ethers";
import EthereumLogo from "./assets/ethereum-eth-logo.svg";

// Extend Window interface to include ethereum and web3
declare global {
  interface Window {
    ethereum?: any;
    web3?: any;
  }
}

const MyWallet: React.FC = () => {
  // Domain and origin
  const domain = window.location.host;
  const origin = window.location.origin;

  const statement = "Sign in with Ethereum to the app.";

  const [siwsMessage, setSiwsMessage] = useState<SIWEthereum | null>(null);
  const [nonce, setNonce] = useState("");
  const [sign, setSignature] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [currentProvider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const detectCurrentProvider = () => {
    let provider;
    if (window.ethereum) {
      provider = window.ethereum;
    } else if (window.web3) {
      provider = window.web3.currentProvider;
    } else {
      console.log("Non-Ethereum browser detected. You should consider trying MetaMask!");
    }
    return provider;
  };

  async function connectWallet() {
    try {
      const detectedProvider = detectCurrentProvider();
      if (detectedProvider) {
        if (detectedProvider !== window.ethereum) {
          Swal.fire("Non-Ethereum browser detected. You should consider trying MetaMask!");
        }

        // Create ethers provider
        const ethersProvider = new ethers.BrowserProvider(detectedProvider);
        setProvider(ethersProvider);

        // Request accounts
        await detectedProvider.request({ method: "eth_requestAccounts" });

        // Get signer and address
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();

        if (address) {
          setPublicKey(address);
        } else {
          console.log("Please connect to meta mask");
        }
      }
    } catch (err) {
      console.log(`There was an error fetching your accounts. Make sure your Ethereum client is configured correctly. ${err}`);
    }
  }

  // Generate a message for signing
  // The nonce is generated on the server side
  async function createEthereumMessage() {
    if (!currentProvider) return;

    const payload = new Payload();
    payload.domain = domain;
    payload.address = publicKey;
    payload.uri = origin;
    payload.statement = statement;
    payload.version = "1";
    payload.chainId = 1;
    const header = new Header();
    header.t = "eip191";
    const message = new SIWEthereum({ header, payload });

    // we need the nonce for verification so getting it in a global variable
    setNonce(message.payload.nonce);
    setSiwsMessage(message);
    const messageText = message.prepareMessage();

    try {
      const signer = await currentProvider.getSigner();
      const signature = await signer.signMessage(messageText);
      setSignature(signature);
    } catch (err) {
      console.log("Error signing message:", err);
    }
  }

  return (
    <>
      {publicKey != "" && sign == "" && (
        <span>
          <p className="center">Sign Transaction</p>
          <input className="publicKey" type="text" id="publicKey" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} />
          <button className="web3auth" id="w3aBtn" onClick={createEthereumMessage}>
            {" "}
            Sign In With Ethereum
          </button>
        </span>
      )}
      {publicKey == "" && sign == "" && (
        <div>
          <div className="logo-wrapper">
            <img className="ethereum-logo" src={EthereumLogo} alt="Ethereum Logo" style={{ width: "100px", height: "auto" }} />
          </div>
          <p className="sign">Sign in With Ethereum</p>
          <button className="web3auth" id="w3aBtn" onClick={connectWallet}>
            {" "}
            Connect Wallet
          </button>
        </div>
      )}

      {sign && (
        <>
          <p className="center">Verify Signature</p>
          <input className="signature" type="text" id="signature" value={sign} onChange={(e) => setSignature(e.target.value)} />
          <button
            className="web3auth"
            id="verify"
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onClick={(e) => {
              const signature = {
                t: "sip99",
                s: sign,
              };
              const payload = siwsMessage!.payload;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              siwsMessage!.verify({ payload, signature }).then((resp: any) => {
                if (resp.success == true) {
                  Swal.fire("Success", "Signature Verified", "success");
                } else {
                  Swal.fire("Error", resp.error!.type, "error");
                }
              });
            }}
          >
            Verify
          </button>
          <button
            className="web3auth"
            id="verify"
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onClick={(e) => {
              setSiwsMessage(null);
              setNonce("");
              setSignature("");
            }}
          >
            Back to Wallet
          </button>
        </>
      )}
    </>
  );
};

export default MyWallet;
