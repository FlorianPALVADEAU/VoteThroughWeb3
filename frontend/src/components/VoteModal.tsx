import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useWallet } from "@/hooks/useWallet"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

type VoteModalProps = {
    isOpen: boolean
    setOpen: (open: boolean) => void
}

const VoteModal = (props: VoteModalProps) => {
    const {
        candidates,
        sendVote,
        currentRound,
        remainingVotes,
        votingActive
    } = useWallet();

    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [isVoting, setIsVoting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedCandidate) {
            alert("Please select a candidate before voting");
            return;
        }
        try {
            setIsVoting(true);
            await sendVote(selectedCandidate);
            
            console.log(`✅ Vote cast successfully for ${selectedCandidate}!`);
            
            setSelectedCandidate('');
            props.setOpen(false);
            
        } catch (error) {
            console.error('Error voting:', error);
            alert("Error casting vote. Please try again.");
        } finally {
            setIsVoting(false);
        }
    }

    const handleClose = () => {
        if (!isVoting) {
            setSelectedCandidate('');
            props.setOpen(false);
        }
    }

    const getModalTitle = () => {
        if (currentRound === 1) {
            return "Choose your candidate";
        }
        return `Round ${currentRound} - Runoff Vote`;
    }

    const getModalDescription = () => {
        if (currentRound === 1) {
            return `Select a candidate to vote for. ${remainingVotes} votes remaining.`;
        }
        return `This is a runoff round due to a tie. Select your preferred candidate from the tied candidates. ${remainingVotes} votes remaining.`;
    }

    if (!votingActive) {
        return null;
    }

    return (
        <Dialog open={props.isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle>{getModalTitle()}</DialogTitle>
                        {currentRound > 1 && (
                            <Badge variant="secondary">Round {currentRound}</Badge>
                        )}
                    </div>
                    <DialogDescription>
                        {getModalDescription()}
                    </DialogDescription>
                </DialogHeader>

                {currentRound > 1 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                            🔄 This is a runoff round because the previous round ended in a tie.
                        </p>
                    </div>
                )}
                
                <div className="space-y-3">
                    <p className="text-sm font-medium">Available candidates:</p>
                    <div className="grid gap-2">
                        {candidates && candidates.length > 0 && (
                            candidates.map((candidate, index) => (
                                <Button 
                                    key={index}
                                    className="w-full justify-start" 
                                    variant={selectedCandidate === candidate ? "default" : "outline"}
                                    onClick={() => setSelectedCandidate(candidate)}
                                    disabled={isVoting}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border-2 ${
                                            selectedCandidate === candidate 
                                                ? 'bg-white border-white' 
                                                : 'border-current'
                                        }`} />
                                        {candidate}
                                        {currentRound > 1 && (
                                            <Badge variant="outline" className="ml-auto">
                                                Tied
                                            </Badge>
                                        )}
                                    </div>
                                </Button>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button 
                            variant="outline" 
                            disabled={isVoting}
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!selectedCandidate || isVoting}
                        className="min-w-[120px]"
                    >
                        {isVoting ? "Voting..." : "Cast Vote"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default VoteModal;