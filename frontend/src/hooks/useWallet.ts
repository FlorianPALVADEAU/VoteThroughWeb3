/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import VotingABI from '../abis/Voting.json';

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ethereum?: any;
    }
}

const contractAddress = '0xbfB1272fC22fD86D0B2b737c88b509E98e269406';
// const contractAddress = '0x87AD66b04f6F3dd04516aDB2f9f0ea57AB6aD273';

export function useWallet() {
    const [wallet, setWallet] = useState<ethers.Contract | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<string[] | null>(null);
    const [hasVoted, setHasVoted] = useState<boolean>(false);
    const [votes, setVotes] = useState<number>(0);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isOwner, setIsOwner] = useState<boolean>(false);

    const [address, setAddress] = useState<string | null>(null);
    const [ensName, setEnsName] = useState<string | null>(null);

    useEffect(() => {
        checkExistingConnection();
    }, []);

    const checkExistingConnection = async () => {
        const manuallyDisconnected = localStorage.getItem('manuallyDisconnected');

        if (manuallyDisconnected === 'true') {
            return;
        } 

        if (!window.ethereum) return;

        try {
            const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error("Error checking existing connection:", error);
        }
    }

    const connectWallet = async () => {
        if (!checkMetaMaskIntalled()) return;

        try {
            setIsConnecting(true);

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const userAddress = await signer.getAddress();
            setAddress(userAddress);

            try {
                const name = await provider.lookupAddress(userAddress);
                setEnsName(name);
            } catch (error) {
                setEnsName(null);
                console.error("Error fetching ENS name:", error);
            }

            const contractSign = new ethers.Contract(contractAddress, VotingABI.abi, signer);
            setWallet(contractSign);
            setIsOwner(await contractSign.owner() === userAddress);
            localStorage.removeItem('manuallyDisconnected');

            await getVotesAndCandidates();

            console.log("Wallet connected successfully.", contractSign);
        } catch (error) {
            console.error("Error connecting wallet:", error);
        } finally {
            setIsConnecting(false);
        }
    }

    const connect = async () => {
        if (!checkMetaMaskIntalled()) return;

        try {
            setIsConnecting(true);

            await window.ethereum.request({ method: 'eth_requestAccounts' });
            await connectWallet();
        } catch (error) {
            console.error("Error connecting to wallet:", error);
            setIsConnecting(false);
        }
    }

    const disconnect = () => {
        setWallet(null);
        setBalance(null);
        setAddress(null);
        setEnsName(null);

        localStorage.setItem('manuallyDisconnected', 'true');
    }

    const checkMetaMaskIntalled = (): boolean => {
        if (!window.ethereum) {
            console.error("MetaMask is not installed. Please install it to use this app.");
            return false;
        }
        return true;
    }

    const checkWalletConnection = async (): Promise<boolean> => {
        if (!wallet || wallet === null) {
            console.error("Wallet is not connected. Please connect your wallet.");
            return false;
        }
        return true;
    }

    const getVotesAndCandidates = async () => {
        if (!checkMetaMaskIntalled()) return;
        if (!checkWalletConnection()) return;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contractSign = new ethers.Contract(contractAddress, VotingABI.abi, signer);

            const v = await contractSign.getAllResults();
            setVotes(v[1].map((c: string) => Number(c)));
            setCandidates(v[0]);
        } catch (error) {
            console.error("Error fetching wallet balance:", error);
            setVotes(0);
        }
    }

    const sendVote = async() => {
        if (!checkMetaMaskIntalled()) return;
        if (!checkWalletConnection()) return;
        if (await wallet?.canVote() === false) return;

        try {
            const vote = await wallet?.sendVote();
            await vote.wait();
            console.log("Vote sent successfully:", vote);
            setHasVoted(true);
            await getVotesAndCandidates();
        } catch (error) {
            console.error("Error sending vote:", error);
        }
    }

    const addCandidate = async (name: string) => {
        if (!checkMetaMaskIntalled()) return;
        if (!checkWalletConnection()) return;
        if (!isOwner) return;

        try {
            const tx = await wallet?.addCandidate(name);
            await tx.wait();
            console.log("Candidate added successfully:", name);
            await getVotesAndCandidates();
        } catch (error) {
            console.error("Error adding candidate:", error);
        }
    }

    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnect();
            } else {
                connectWallet();
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        }

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            if (window.ethereum?.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        }
    }, [])

    return {
        wallet,
        balance,
        address,
        ensName,
        isConnecting,
        connect,
        disconnect,
        isConnected: !!wallet,
        getVotesAndCandidates,
        candidates,
        getWalletVotes: getVotesAndCandidates,
        votes,
        sendVote,
        isOwner,
        hasVoted,
        addCandidate
    }
}