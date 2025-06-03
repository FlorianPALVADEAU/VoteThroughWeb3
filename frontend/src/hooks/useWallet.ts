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

    const [currentRound, setCurrentRound] = useState<number>(1);
    const [maxVoters, setMaxVoters] = useState<number>(0);
    const [remainingVotes, setRemainingVotes] = useState<number>(0);
    const [votingActive, setVotingActive] = useState<boolean>(true);

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

            const ownerAddress = await contractSign.owner();
            setIsOwner(ownerAddress.toLowerCase() === userAddress.toLowerCase());
            localStorage.removeItem('manuallyDisconnected');


            await loadContractData(contractSign, userAddress);
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
        setCandidates(null);
        setHasVoted(false);
        setVotes(0);
        setIsOwner(false);

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

    const loadContractData = async (contractInstance?: ethers.Contract, userAddress?: string) => {
        const contract = contractInstance || wallet;
        if (!contract) return;

        try {
            const votingStatus = await contract.getVotingStatus();
            setCurrentRound(Number(votingStatus._currentRound));
            setVotes(Number(votingStatus._totalVotes));
            setMaxVoters(Number(votingStatus._maxVoters));
            setRemainingVotes(Number(votingStatus._remainingVotes));
            setVotingActive(votingStatus._votingActive);

            if (userAddress || address) {
                const userHasVoted = await contract.checkIfVoted(userAddress || address);
                setHasVoted(userHasVoted);
            }

            const candidatesList = await contract?.getAllCandidates();
            setCandidates(candidatesList);

            console.log("Contract data loaded:", {
                round: votingStatus._currentRound,
                totalVotes: votingStatus._totalVotes,
                maxVoters: votingStatus._maxVoters,
                remainingVotes: votingStatus._remainingVotes,
                votingActive: votingStatus._votingActive,
                candidates: candidatesList
            });

        } catch (error) {
            console.error("Error loading contract data:", error);
        }
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

    const getCandidates = async () => {
        if (!checkMetaMaskIntalled()) return;

        try {
            if (!await checkWalletConnection()) return;

            const c = await wallet?.getAllCandidates();
            if (c && Array.isArray(c)) {
                setCandidates(c);
                console.log("candidates", c);
                
            } else {
                console.error("Invalid candidates data:", c);
                setCandidates([]);
            }
        } catch (error) {
            console.error("Error fetching candidates:", error);
            return [];
        }
    }

    const sendVote = async (candidateName: string) => {
        if (!checkMetaMaskIntalled()) return;
        if (!await checkWalletConnection()) return;

        try {
            const canVote = await wallet?.canVote();
            if (!canVote) {
                console.error("You cannot vote at this time");
                return;
            }


            const tx = await wallet?.sendVote(candidateName);
            await tx.wait();
            
            console.log("Vote sent successfully:", tx);
            
            await loadContractData();
        } catch (error) {
            console.error("Error sending vote:", error);
            throw error; // Relancer l'erreur pour que l'UI puisse la gérer
        }
    }

    const addCandidate = async (name: string) => {
        if (!checkMetaMaskIntalled()) return;
        if (!await checkWalletConnection()) return;
        if (!isOwner) {
            console.error("Only owner can add candidates");
            return;
        }

        try {
            const tx = await wallet?.addCandidate(name);
            await tx.wait();
            console.log("Candidate added successfully:", name);
          
            await loadContractData();
            await getVotesAndCandidates();
        } catch (error) {
            console.error("Error adding candidate:", error);
            throw error;
        }
    }

    const getResults = async () => {
        if (!wallet) return null;
        
        try {
            const results = await wallet.getAllResults();
            return {
                candidates: results[0],
                votes: results[1].map((v: any) => Number(v))
            };
        } catch (error) {
            console.error("Error getting results:", error);
            return null;
        }
    }

    const getWinners = async () => {
        if (!wallet) return null;
        
        try {
            const winners = await wallet.getWinners();
            return winners;
        } catch (error) {
            console.error("Error getting winners:", error);
            return null;
        }
    }

    const resetVotersForNewRound = async (voterAddresses: string[]) => {
        if (!wallet || !isOwner) return;
        
        try {
            const tx = await wallet.resetVotersForNewRound(voterAddresses);
            await tx.wait();
            console.log("Voters reset for new round");
            await loadContractData();
        } catch (error) {
            console.error("Error resetting voters:", error);
            throw error;
        }
    }

    const setMaxVotersCount = async (newMaxVoters: number) => {
        if (!wallet || !isOwner) return;
        
        try {
            const tx = await wallet.setMaxVoters(newMaxVoters);
            await tx.wait();
            console.log("Max voters updated:", newMaxVoters);
            await loadContractData();
        } catch (error) {
            console.error("Error setting max voters:", error);
            throw error;
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

    const refreshData = async () => {
        if (wallet) {
            await loadContractData();
        }
    }

    return {
        wallet,
        balance,
        address,
        ensName,
        isConnecting,
        connect,
        disconnect,
        isConnected: !!wallet,
        candidates,
        getVotesAndCandidates,
        candidates,
        votes,
        sendVote,
        isOwner,
        hasVoted,
        addCandidate,
        
        // Nouveaux états et fonctions
        currentRound,
        maxVoters,
        remainingVotes,
        votingActive,
        loadContractData,
        getResults,
        getWinners,
        resetVotersForNewRound,
        setMaxVotersCount,
        refreshData
    }
}