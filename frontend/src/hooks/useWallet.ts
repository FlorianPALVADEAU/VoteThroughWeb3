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

const contractAddress = '0x28b2bcA9fB7ebF2165A2d482d47Ea45c24279922';

export function useWallet() {
    const [wallet, setWallet] = useState<ethers.Contract | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<string[] | null>(null);
    const [hasVoted, setHasVoted] = useState<boolean>(false);
    const [votes, setVotes] = useState<number>(0);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [votesArray, setVotesArray] = useState<number[]>([]);

    const [address, setAddress] = useState<string | null>(null);
    const [ensName, setEnsName] = useState<string | null>(null);

    const [currentRound, setCurrentRound] = useState<number>(1);
    const [maxVoters, setMaxVoters] = useState<number>(0);
    const [remainingVotes, setRemainingVotes] = useState<number>(0);
    const [votingActive, setVotingActive] = useState<boolean>(true);
    const [isVotingComplete, setIsVotingComplete] = useState<boolean>(false);
    const [winners, setWinners] = useState<string[]>([]);
    const [isPolling, setIsPolling] = useState<boolean>(false);

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
        setVotesArray([]);
        setWinners([]);
        setIsVotingComplete(false);

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
            setIsVotingComplete(votingStatus._isComplete);

            if (userAddress || address) {
                const userHasVoted = await contract.checkIfVoted(userAddress || address);
                setHasVoted(userHasVoted);
            }

            const candidatesList = await contract?.getAllCandidates();
            setCandidates(candidatesList);

            if (candidatesList && candidatesList.length > 0) {
                const results = await contract.getAllResults();
                setVotesArray(results[1].map((v: any) => Number(v)));
            }

            if (votingStatus._isComplete) {
                try {
                    const currentWinners = await contract.getWinners();
                    setWinners(currentWinners);
                } catch (error) {
                    console.error("Error getting winners:", error);
                }
            }

        } catch (error) {
            console.error("Error loading contract data:", error);
        }
    }

    const getVotesAndCandidates = async () => {
        await loadContractData();
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
            console.log("Vote transaction sent, waiting for confirmation...");
            
            await tx.wait();
            console.log("Vote sent successfully:", tx);
            
            await loadContractData();
            
        } catch (error) {
            console.error("Error sending vote:", error);
            throw error;
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
            console.log("Candidate addition transaction sent, waiting for confirmation...");
            
            await tx.wait();
            console.log("Candidate added successfully:", name);
            
            await loadContractData();
            
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

    const resetVotersForNewRound = async (voterAddresses?: string[]) => {
        if (!wallet || !isOwner) return;
        
        try {
            let addresses = voterAddresses;
            
            if (!addresses) {
                addresses = await wallet.getAllVoters();
            }
            
            if (addresses && addresses.length > 0) {
                const tx = await wallet.resetVotersForNewRound(addresses);
                await tx.wait();
                console.log("Voters reset for new round");
                await loadContractData();
            }
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

    const restartVoting = async () => {
        if (!wallet || !isOwner) return;
        
        try {
            console.log("Restarting voting system...");
            
            const tx = await wallet.restartVoting();
            await tx.wait();
            
            console.log("Voting restarted successfully");
            
            setCandidates([]);
            setVotes(0);
            setVotesArray([]);
            setWinners([]);
            setIsVotingComplete(false);
            setHasVoted(false);
            setCurrentRound(1);
            setVotingActive(true);
            
            await loadContractData();
        } catch (error) {
            console.error("Error restarting voting:", error);
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

    const startPolling = () => {
        if (!isPolling && wallet) {
            setIsPolling(true);
            const intervalId = setInterval(async () => {
                try {
                    await loadContractData();
                } catch (error) {
                    console.error("Error during polling:", error);
                }
            }, 3000);

            return intervalId;
        }
    };

    const stopPolling = (intervalId: NodeJS.Timeout | null) => {
        if (intervalId) {
            clearInterval(intervalId);
            setIsPolling(false);
        }
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null | undefined = null;

        if (wallet && votingActive) {
            intervalId = startPolling();
        }

        return () => {
            if (intervalId) {
                stopPolling(intervalId);
            }
        };
    }, [wallet, votingActive]);

    useEffect(() => {
        if (!votingActive || isVotingComplete) {
            setIsPolling(false);
        }
    }, [votingActive, isVotingComplete]);

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
        votes,
        votesArray,
        sendVote,
        isOwner,
        hasVoted,
        addCandidate,
        getVotesAndCandidates,
        
        currentRound,
        maxVoters,
        remainingVotes,
        votingActive,
        isVotingComplete,
        winners,
        isPolling,
        loadContractData,
        getResults,
        getWinners,
        resetVotersForNewRound,
        setMaxVotersCount,
        restartVoting,
        refreshData,
        startPolling,
        stopPolling
    }
}