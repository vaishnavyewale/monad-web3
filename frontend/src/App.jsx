import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

const MONAD = {
  chainId: "0x279F",
  chainName: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com"],
};

const RPC_URL = "https://testnet-rpc.monad.xyz";

const EXPLORER_URL =
  "https://testnet.monadexplorer.com";

const CONTRACT_ADDRESS =
  "0x30a8EdB4E99456e9961af4cecEE36543507Dcf68";

const CONTRACT_ABI = [
  "function eventCount() view returns (uint256)",

  "function getEvent(uint256 eventId) view returns (uint256 id, string title, uint256 date, uint256 maxSeats, uint256 registeredCount)",

  "function isRegistered(uint256 eventId, address student) view returns (bool)",

  "function register(uint256 eventId)",
];

const DEFAULT_EVENTS = [
  {
    id: 1,
    title: "AI & Machine Learning Workshop",
    date: "October 10, 2026",
    maxSeats: 50,
    registeredCount: 0,
  },
  {
    id: 2,
    title: "Web3 & Blockchain Bootcamp",
    date: "October 15, 2026",
    maxSeats: 40,
    registeredCount: 0,
  },
  {
    id: 3,
    title: "DevOps Deployment Lab",
    date: "October 20, 2026",
    maxSeats: 35,
    registeredCount: 0,
  },
];

function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0.0000");

  const [events, setEvents] =
    useState(DEFAULT_EVENTS);

  const [registered, setRegistered] =
    useState({});

  const [loading, setLoading] =
    useState(false);

  const [connecting, setConnecting] =
    useState(false);

  const [registering, setRegistering] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [transactionHash, setTransactionHash] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState("");

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    checkWallet();

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    window.ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, []);

  async function checkWallet() {
    try {
      const accounts =
        await window.ethereum.request({
          method: "eth_accounts",
        });

      if (accounts.length === 0) {
        return;
      }

      await loadWallet(accounts[0]);
    } catch (error) {
      console.error(
        "Wallet check error:",
        error
      );
    }
  }

  async function handleAccountsChanged(
    accounts
  ) {
    if (accounts.length === 0) {
      setAccount("");
      setBalance("0.0000");
      setRegistered({});
      return;
    }

    await loadWallet(accounts[0]);
  }

  function handleChainChanged() {
    window.location.reload();
  }

  async function switchToMonad() {
    try {
      await window.ethereum.request({
        method:
          "wallet_switchEthereumChain",
        params: [
          {
            chainId: MONAD.chainId,
          },
        ],
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method:
            "wallet_addEthereumChain",
          params: [MONAD],
        });
      } else {
        throw error;
      }
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        showMessage(
          "Please install MetaMask."
        );
        return;
      }

      setConnecting(true);

      await switchToMonad();

      const accounts =
        await window.ethereum.request({
          method:
            "eth_requestAccounts",
        });

      if (accounts.length === 0) {
        return;
      }

      await loadWallet(accounts[0]);

      showMessage(
        "Wallet connected successfully."
      );
    } catch (error) {
      console.error(
        "Connection error:",
        error
      );

      if (error.code === 4001) {
        showMessage(
          "Connection rejected in MetaMask."
        );
      } else {
        showMessage(
          error.shortMessage ||
            error.message ||
            "Connection failed."
        );
      }
    } finally {
      setConnecting(false);
    }
  }

  async function loadWallet(walletAddress) {
    try {
      setLoading(true);

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const network =
        await provider.getNetwork();

      if (network.chainId !== 10143n) {
        await switchToMonad();
        return;
      }

      setAccount(walletAddress);

      const balanceWei =
        await provider.getBalance(
          walletAddress
        );

      const formattedBalance =
        ethers.formatEther(balanceWei);

      setBalance(
        Number(formattedBalance).toFixed(4)
      );

      await loadBlockchainEvents(
        walletAddress
      );
    } catch (error) {
      console.error(
        "Wallet loading error:",
        error
      );

      showMessage(
        "Could not load wallet data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadBlockchainEvents(
    walletAddress
  ) {
    try {
      setLoading(true);

      const provider =
        new ethers.JsonRpcProvider(
          RPC_URL
        );

      const contract =
        new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          provider
        );

      const count = Number(
        await contract.eventCount()
      );

      const blockchainEvents = [];
      const registrationState = {};

      for (
        let id = 1;
        id <= count;
        id++
      ) {
        const event =
          await contract.getEvent(id);

        const userRegistered =
          await contract.isRegistered(
            id,
            walletAddress
          );

        blockchainEvents.push({
          id: Number(event.id),
          title: event.title,
          date: formatDate(
            Number(event.date)
          ),
          maxSeats: Number(
            event.maxSeats
          ),
          registeredCount:
            Number(
              event.registeredCount
            ),
        });

        registrationState[id] =
          userRegistered;
      }

      setEvents(blockchainEvents);

      setRegistered(
        registrationState
      );

      setLastUpdated(
        new Date().toLocaleTimeString()
      );

      console.log(
        "Blockchain events:",
        blockchainEvents
      );

      console.log(
        "Registration status:",
        registrationState
      );
    } catch (error) {
      console.error(
        "Blockchain loading error:",
        error
      );

      showMessage(
        "Could not load blockchain data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    if (!account) {
      showMessage(
        "Connect your wallet first."
      );
      return;
    }

    await loadWallet(account);

    showMessage(
      "Blockchain data refreshed."
    );
  }

  async function registerEvent(eventId) {
    if (!account) {
      await connectWallet();
      return;
    }

    try {
      setRegistering(eventId);
      setTransactionHash("");

      await switchToMonad();

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const contract =
        new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

      const alreadyRegistered =
        await contract.isRegistered(
          eventId,
          account
        );

      if (alreadyRegistered) {
        showMessage(
          "You are already registered."
        );

        await loadWallet(account);

        return;
      }

      showMessage(
        "Confirm the transaction in MetaMask."
      );

      const transaction =
        await contract.register(eventId);

      setTransactionHash(
        transaction.hash
      );

      showMessage(
        "Transaction submitted. Waiting for confirmation..."
      );

      await transaction.wait();

      showMessage(
        "Registration confirmed on Monad!"
      );

      await loadWallet(account);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      if (error.code === 4001) {
        showMessage(
          "Transaction rejected in MetaMask."
        );
      } else {
        showMessage(
          error.reason ||
            error.shortMessage ||
            error.message ||
            "Registration failed."
        );
      }
    } finally {
      setRegistering(null);
    }
  }

  function formatDate(timestamp) {
    return new Date(
      timestamp * 1000
    ).toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function shortenAddress(address) {
    if (!address) {
      return "";
    }

    return (
      address.slice(0, 6) +
      "..." +
      address.slice(-4)
    );
  }

  function showMessage(text) {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 5000);
  }

  const myRegistrations =
    events.filter(
      (event) =>
        registered[event.id] === true
    );

  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">
        <div className="logo">
          <span className="logo-mark">
            ◆
          </span>

          CampusHub
        </div>

        <div className="nav-links">
          <a href="#events">
            Events
          </a>

          <a href="#registrations">
            My Registrations
          </a>

          <a href="#how">
            How it works
          </a>
        </div>

        <button
          className="connect-btn"
          onClick={connectWallet}
          disabled={connecting}
        >
          {account
            ? shortenAddress(account)
            : connecting
            ? "Connecting..."
            : "Connect Wallet"}
        </button>
      </nav>


      {/* HERO */}

      <main>

        <section className="hero">

          <div className="hero-content">

            <div className="badge">
              <span className="pulse"></span>

              Monad Testnet
            </div>

            <h1>
              Your campus.
              <br />

              <span>
                On-chain.
              </span>
            </h1>

            <p>
              Discover campus events,
              connect your wallet, and
              register directly on the
              blockchain.
            </p>

            <div className="hero-actions">

              <a
                href="#events"
                className="primary-btn"
              >
                Explore Events →
              </a>

              {!account && (
                <button
                  className="secondary-btn"
                  onClick={
                    connectWallet
                  }
                >
                  Connect MetaMask
                </button>
              )}

            </div>

          </div>


          {/* NETWORK CARD */}

          <div className="hero-card">

            <div className="card-top">

              <span>
                NETWORK
              </span>

              <span className="online">
                ● ONLINE
              </span>

            </div>

            <div className="network-name">
              Monad Testnet
            </div>

            <div className="network-details">

              <div>
                <small>
                  CHAIN ID
                </small>

                <strong>
                  10143
                </strong>
              </div>

              <div>
                <small>
                  TOKEN
                </small>

                <strong>
                  MON
                </strong>
              </div>

            </div>

            <div className="contract-box">

              <small>
                CONTRACT
              </small>

              <span>
                {shortenAddress(
                  CONTRACT_ADDRESS
                )}
              </span>

            </div>

          </div>

        </section>


        {/* WALLET PANEL */}

        {account && (
          <section className="wallet-panel">

            <div>
              <span className="panel-label">
                WALLET
              </span>

              <strong>
                {shortenAddress(
                  account
                )}
              </strong>
            </div>

            <div>
              <span className="panel-label">
                BALANCE
              </span>

              <strong>
                {balance} MON
              </strong>
            </div>

            <div>
              <span className="panel-label">
                NETWORK
              </span>

              <strong>
                Monad Testnet
              </strong>
            </div>

            <div>
              <button
                className="refresh-btn"
                onClick={
                  refreshData
                }
                disabled={loading}
              >
                {loading
                  ? "Refreshing..."
                  : "↻ Refresh"}
              </button>
            </div>

          </section>
        )}


        {/* TRANSACTION STATUS */}

        {transactionHash && (
          <section className="transaction-panel">

            <div>
              <strong>
                Latest Transaction
              </strong>

              <span>
                {shortenAddress(
                  transactionHash
                )}
              </span>
            </div>

            <a
              href={
                EXPLORER_URL +
                "/tx/" +
                transactionHash
              }
              target="_blank"
              rel="noreferrer"
            >
              View on Monad Explorer ↗
            </a>

          </section>
        )}


        {/* EVENTS */}

        <section
          id="events"
          className="events-section"
        >

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                DISCOVER
              </span>

              <h2>
                Campus Events
              </h2>

            </div>

            <p>
              Register for campus events
              directly on Monad.
            </p>

          </div>


          {loading ? (
            <div className="loading-state">
              <div className="loader"></div>

              <p>
                Loading events from Monad...
              </p>
            </div>
          ) : (

            <div className="events-grid">

              {events.map((event) => {

                const userRegistered =
                  registered[
                    event.id
                  ] === true;

                const eventFull =
                  event.registeredCount >=
                  event.maxSeats;

                const processing =
                  registering ===
                  event.id;

                const seatsLeft =
                  event.maxSeats -
                  event.registeredCount;

                return (

                  <article
                    className="event-card"
                    key={event.id}
                  >

                    <div className="event-number">
                      {String(
                        event.id
                      ).padStart(
                        2,
                        "0"
                      )}
                    </div>


                    <div className="event-content">

                      <div className="event-date">
                        {event.date}
                      </div>

                      <h3>
                        {event.title}
                      </h3>


                      <div className="event-stats">

                        <span>
                          👥{" "}
                          {
                            event.registeredCount
                          }
                          /
                          {
                            event.maxSeats
                          }{" "}
                          registered
                        </span>

                        <span>
                          {seatsLeft} seats left
                        </span>

                      </div>


                      <div className="event-status">

                        {userRegistered && (
                          <span className="status-success">
                            ✓ Registered
                          </span>
                        )}

                        {!userRegistered &&
                          eventFull && (
                            <span className="status-full">
                              Event Full
                            </span>
                          )}

                        {!userRegistered &&
                          !eventFull && (
                            <span className="status-open">
                              ● Registration Open
                            </span>
                          )}

                      </div>


                      <button
                        className={
                          "register-btn" +
                          (
                            userRegistered
                              ? " registered"
                              : ""
                          )
                        }
                        disabled={
                          userRegistered ||
                          eventFull ||
                          processing
                        }
                        onClick={() =>
                          registerEvent(
                            event.id
                          )
                        }
                      >

                        {processing
                          ? "Confirming..."
                          : userRegistered
                          ? "✓ Registered On-chain"
                          : eventFull
                          ? "Event Full"
                          : "Register →"}

                      </button>

                    </div>

                  </article>

                );
              })}

            </div>

          )}

          {lastUpdated && (
            <div className="last-updated">
              Blockchain data updated at{" "}
              {lastUpdated}
            </div>
          )}

        </section>


        {/* MY REGISTRATIONS */}

        {account && (
          <section
            id="registrations"
            className="registrations-section"
          >

            <div className="section-heading">

              <div>

                <span className="eyebrow">
                  YOUR ACTIVITY
                </span>

                <h2>
                  My Registrations
                </h2>

              </div>

              <p>
                Events registered by your
                connected wallet.
              </p>

            </div>


            {myRegistrations.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  ◇
                </div>

                <h3>
                  No registrations yet
                </h3>

                <p>
                  Register for an event
                  and it will appear here.
                </p>

                <a
                  href="#events"
                  className="primary-btn"
                >
                  Browse Events
                </a>

              </div>

            ) : (

              <div className="my-registrations">

                {myRegistrations.map(
                  (event) => (

                    <div
                      className="registration-card"
                      key={event.id}
                    >

                      <div>

                        <span className="registration-check">
                          ✓
                        </span>

                        <div>
                          <h3>
                            {event.title}
                          </h3>

                          <p>
                            {event.date}
                          </p>
                        </div>

                      </div>

                      <span className="onchain-label">
                        ON-CHAIN
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </section>
        )}


        {/* HOW IT WORKS */}

        <section
          id="how"
          className="how-section"
        >

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                PROCESS
              </span>

              <h2>
                How it works
              </h2>

            </div>

          </div>


          <div className="steps">

            <div className="step">
              <span>01</span>

              <h3>
                Connect
              </h3>

              <p>
                Connect MetaMask to
                CampusHub.
              </p>
            </div>


            <div className="step">
              <span>02</span>

              <h3>
                Choose
              </h3>

              <p>
                Select a campus event.
              </p>
            </div>


            <div className="step">
              <span>03</span>

              <h3>
                Register
              </h3>

              <p>
                Confirm the transaction
                through MetaMask.
              </p>
            </div>


            <div className="step">
              <span>04</span>

              <h3>
                On-chain
              </h3>

              <p>
                Your registration is
                recorded on Monad.
              </p>
            </div>

          </div>

        </section>

      </main>


      {/* FOOTER */}

      <footer>

        <div className="logo">
          <span className="logo-mark">
            ◆
          </span>

          CampusHub
        </div>

        <p>
          Built on Monad Testnet ·
          Web3 Campus Platform
        </p>

      </footer>


      {/* TOAST */}

      {message && (
        <div className="toast">
          {message}
        </div>
      )}

    </div>
  );
}

export default App;