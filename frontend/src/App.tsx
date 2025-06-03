/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  RadialBarChart,
  RadialBar,
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
import { TooltipContent, TooltipTrigger, Tooltip as UiTooltip } from "./components/ui/tooltip";
import VoteModal from "./components/VoteModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function App() {
  const {
    // États de base
    isConnected,
    address,
    isOwner,
    connect,
    disconnect,
    
    // États du vote
    candidates,
    votes,
    maxVoters,
    currentRound,
    hasVoted,
    votingActive,
    remainingVotes,
    
    // Fonctions
    sendVote,
    addCandidate,
    refreshData
    getVotesAndCandidates,
    sendVote,
    hasVoted,
    votes,
    isOwner,
    isConnecting
  } = useWallet();

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00bcd4", "#ff69b4", "#a2cf6e"];
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadCandidates();
    }

    try {
        setIsVoting(true);
        await sendVote(candidateName); // ✅ Passe bien une string
        alert(`Vote envoyé avec succès pour ${candidateName}!`);
    } catch (error) {
        console.error('Erreur lors du vote:', error);
        alert('Erreur lors du vote. Vérifiez la console.');
    } finally {
        setIsVoting(false);
    }
  };

  const [isVoting, setIsVoting] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openModalVote, setOpenModalVote] = useState(false);

  const mockData = candidates?.map((name, i) => ({
    name,
    votes: Math.floor(Math.random() * 100), // Replace with real votes later
    fill: `hsl(${(i * 100) % 360}, 70%, 50%)`
  })) || [];

  return (
    <main className="max-w-4xl mx-auto mt-12 p-4 space-y-6">
      {
        isOwner && (
          <Button onClick={() => {setOpenModal(!openModal)}} variant="destructive">
            Add Candidate
          </Button>
        )
      }
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
                <h1 className="text-2xl font-semibold">Vote Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? `Connected: ${address}` : "Not connected"}
                </p>
              </div>
              <Button onClick={isConnected ? disconnect : connect}>
                {isConnected ? "Disconnect" : "Connect Wallet"}
              </Button>
            </div>
            <Separator />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">Total Votes: {votes}</p>
                <p className="text-sm text-muted-foreground">
                  {hasVoted ? "You have voted." : "You haven't voted yet."}
                </p>
              </div>
              {isConnected && !hasVoted && (
                <Button onClick={sendVote} disabled={!candidates?.length} className="mt-4 md:mt-0">
                  Cast Vote
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Candidate Dominance</h2>
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
                          votes: Array.isArray(votes) ? votes[index] || 0 : 0,
                          fill: COLORS[index % COLORS.length],
                        }))}
                        margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                      >
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip
                          formatter={(value, name, props) => {
                            const totalVotes = Array.isArray(votes) ? votes.reduce((a, b) => a + b, 0) : Number(votes) || 0;
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
                  <>
                    <p>No candidates available.</p>
                    <p>{isOwner ? "Please add candidates to start voting." : "Please contact your administrator to add candidates."}</p>
                  </>
                )
            )}
          </CardContent>
        </Card>
      </>
      )}
      <AddCandidateModal isOpen={openModal} setOpen={setOpenModal}/>
      <VoteModal isOpen={openModalVote} setOpen={setOpenModalVote} />
    </main>
  );
}
