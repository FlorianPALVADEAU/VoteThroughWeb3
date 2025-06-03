/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Legend,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
  Cell,
  XAxis,
  YAxis
} from "recharts";
import { AddCandidateModal } from "./components/AddCandidateModal";
import VoteModal from "./components/VoteModal";
import { Skeleton } from "@/components/ui/skeleton";
import { DisplayResultsModal } from "./components/DisplayResultsModal";

export default function App() {
  const {
    isConnected,
    address,
    isOwner,
    connect,
    disconnect,    
    candidates,
    votes,
    hasVoted,
    getVotesAndCandidates,
    isConnecting,
    votesArray,
    currentRound,
    maxVoters,
    remainingVotes,
    votingActive,
    isVotingComplete,
    winners,
    restartVoting,
    isPolling
  } = useWallet();

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00bcd4", "#ff69b4", "#a2cf6e"];
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openModalVote, setOpenModalVote] = useState(false);
  const [openResultsModal, setOpenResultsModal] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  useEffect(() => {
    if (candidates || votes || votesArray) {
      setLastUpdateTime(new Date());
    }
  }, [candidates, votes, votesArray]);

  useEffect(() => {
    if (isConnected) {
      loadCandidates();
    }
  }, [isConnected]);

  useEffect(() => {
    if (isVotingComplete && winners.length > 0) {
      if (winners.length === 1) {
        setOpenResultsModal(true);
      } else if (winners.length > 1) {
        console.log("Tie detected, moving to round", currentRound + 1);
      }
    }
  }, [isVotingComplete, winners, currentRound]);

  const loadCandidates = async () => {
    setLoadingCandidates(true);
    await getVotesAndCandidates();
    setLoadingCandidates(false);
  };

  const handleRestart = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to restart the voting system? This will delete all current votes and candidates."
    );
    
    if (!confirmed) return;
    
    try {
      setIsRestarting(true);
      await restartVoting();
      setOpenResultsModal(false);
    } catch (error) {
      console.error("Error restarting voting:", error);
      alert("Error restarting the vote. Please try again.");
    } finally {
      setIsRestarting(false);
    }
  };

  const getRoundStatus = () => {
    if (!votingActive && winners.length === 1) {
      return `Voting Complete - Winner: ${winners[0]}`;
    }
    if (isVotingComplete && winners.length > 1) {
      return `Round ${currentRound} Complete - Tie detected, preparing next round`;
    }
    if (winners.length > 1 && currentRound > 1) {
      return `Round ${currentRound} - Runoff between tied candidates`;
    }
    return `Round ${currentRound} - Voting in progress`;
  };

  const getRoundVariant = () => {
    if (!votingActive && winners.length === 1) return "default";
    if (isVotingComplete && winners.length > 1) return "secondary";
    if (currentRound > 1) return "outline";
    return "secondary";
  };

  return (
    <main className="max-w-4xl mx-auto mt-12 p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Vote Dashboard</h1>
            {isPolling && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full text-green-700 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </div>
            )}
          </div>
          <Badge variant={getRoundVariant()} className="text-sm">
            {getRoundStatus()}
          </Badge>
        </div>
        
        {isOwner && (
          <div className="flex gap-2">
            {currentRound === 1 && votingActive && (
              <Button onClick={() => {setOpenModal(!openModal)}} variant="destructive">
                Add Candidate
              </Button>
            )}
            
            <Button 
              onClick={handleRestart} 
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
              disabled={isRestarting}
            >
              {isRestarting ? "🔄 Restarting..." : "🔄 Restart Vote"}
            </Button>
          </div>
        )}
      </div>

      { isConnecting ? (
        <div className="space-y-4 mt-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-120 w-full rounded-xl" />
        </div>
      ) : (
        <>
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Connection Status</h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? `Connected: ${address}` : "Not connected"}
                  </p>
                  {lastUpdateTime && isPolling && (
                    <span className="text-xs text-green-600">
                      • Updated {lastUpdateTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <Button onClick={isConnected ? disconnect : connect}>
                {isConnected ? "Disconnect" : "Connect Wallet"}
              </Button>
            </div>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{votes}</p>
                <p className="text-sm text-muted-foreground">Total Votes</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">{remainingVotes}</p>
                <p className="text-sm text-muted-foreground">Remaining Votes</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{maxVoters}</p>
                <p className="text-sm text-muted-foreground">Max Voters</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">
                  Status: {hasVoted ? "✅ You have voted" : "⏳ You haven't voted yet"}
                </p>
                {currentRound > 1 && (
                  <p className="text-sm text-muted-foreground">
                    🔄 This is a runoff round due to a tie in the previous round
                  </p>
                )}
              </div>
              {isConnected && !hasVoted && votingActive && (
                <Button 
                  onClick={() => (setOpenModalVote(!openModalVote))} 
                  disabled={!candidates?.length} 
                  className="mt-4 md:mt-0"
                >
                  Cast Vote
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Candidate Results</h2>
            
            {loadingCandidates ? (
              <p>Loading candidates...</p>
            ) : (
                candidates && candidates.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={candidates.map((candidate, index) => ({
                          name: candidate,
                          votes: Array.isArray(votesArray) ? votesArray[index] || 0 : 0,
                          fill: COLORS[index % COLORS.length],
                        }))}
                        margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                      >
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip
                          formatter={(value, _name, props) => {
                            const totalVotes = Array.isArray(votesArray) ? votesArray.reduce((a, b) => a + b, 0) : Number(votesArray) || 0;
                            const percentage = totalVotes > 0 ? ((Number(value) / totalVotes) * 100).toFixed(1) : "0.0";
                            return [`${value} votes (${percentage}%)`, props.payload.name];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="votes" label={{ position: "right", fill: "#000" }}>
                          {candidates.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-lg mb-2">No candidates available.</p>
                    <p className="text-sm text-muted-foreground">
                      {isOwner ? "Please add candidates to start voting." : "Please contact your administrator to add candidates."}
                    </p>
                  </div>
                )
            )}
          </CardContent>
        </Card>
      </>
      )}
      
      <AddCandidateModal isOpen={openModal} setOpen={setOpenModal}/>
      <DisplayResultsModal 
        isOpen={openResultsModal} 
        setOpen={setOpenResultsModal}
        winner={winners.length === 1 ? winners[0] : null}
        onRestart={handleRestart}
        isRestarting={isRestarting}
      />
      <VoteModal isOpen={openModalVote} setOpen={setOpenModalVote} />
    </main>
  );
}