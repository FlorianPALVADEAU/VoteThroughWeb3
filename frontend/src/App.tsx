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
  ResponsiveContainer
} from "recharts";
import { AddCandidateModal } from "./components/AddCandidateModal";
import { TooltipContent, TooltipTrigger, Tooltip as UiTooltip } from "./components/ui/tooltip";
import VoteModal from "./components/VoteModal";

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
  } = useWallet();

  const handleVote = async (candidateName) => {
    if (!candidateName || typeof candidateName !== 'string') {
        alert('Nom de candidat invalide');
        return;
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
              <Button onClick={() => {setOpenModalVote(!openModal)}} disabled={!candidates?.length} className="mt-4 md:mt-0">
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
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="80%"
                      innerRadius="10%"
                      outerRadius="100%"
                      barSize={15}
                      data={mockData}
                      startAngle={180}
                      endAngle={0}
                    >
                      <RadialBar
                        background
                        dataKey="votes"
                      />
                      <Legend
                        iconSize={10}
                        layout="horizontal"
                        verticalAlign="top"
                        align="center"
                      />
                      <Tooltip />
                    </RadialBarChart>
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
      <AddCandidateModal isOpen={openModal} setOpen={setOpenModal}/>
      <VoteModal isOpen={openModalVote} setOpen={setOpenModalVote} />
    </main>
  );
}
