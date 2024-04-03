"use client";

import { useEffect, useState } from "react";
import { Button, Avatar, Dropdown, Navbar } from "flowbite-react";

function displayAddress(addr) {
  if (addr.length >= 10) {
    return addr.substring(0, 4) + "..." + addr.substring(addr.length - 4);
  } else {
    return addr;
  }
}

function handleAccountsChanged(accounts) {
  checkStatus();
}

function disconnect() {
  // If you're using a provider like MetaMask, you can reset it
  if (window.ethereum) {
    window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    window.ethereum = null;
  }
}

export default function Navigation({ selected }) {
  console.log("selected: ", selected);

  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [language, setLanguage] = useState("en");

  return (
    <Navbar fluid rounded>
      <Navbar.Brand href="/">
        <img src="/ming_logo.png" className="mr-3 h-6 sm:h-9" alt="Logo" />
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
          Solana冥币
        </span>
      </Navbar.Brand>
      
    </Navbar>
  );
}
