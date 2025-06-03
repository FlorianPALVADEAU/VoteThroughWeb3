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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/hooks/useWallet"
import { Checkbox } from "@radix-ui/react-checkbox"
import { useState } from "react"

type AddCandidateModalProps = {
    isOpen: boolean
    setOpen: (open: boolean) => void
  }

const VoteModal = (props: AddCandidateModalProps) => {
    const {
        candidates,
        sendVote,
        refreshData
    } = useWallet();


    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [isVoting, setIsVoting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedCandidate) {
            console.error("Please select a candidate before voting");
            return;
        }
        try {
            setIsVoting(true);
            await sendVote(selectedCandidate);
            await refreshData();
            
            props.setOpen(false);
            setSelectedCandidate('');
            
        } catch (error) {
            console.error('Error voting:', error);
        } finally {
            setIsVoting(false);
        }
    }

    const handleClose = () => {
        if (!isVoting) {
            setSelectedCandidate(''); // Reset selection when closing
            props.setOpen(false);
        }
    }

    return (
        <Dialog open={props.isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Choose your candidate</DialogTitle>
                    <DialogDescription>
                        Select a candidate to vote for. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex w-full gap-4">
                    {candidates && candidates.length > 0 && (
                        candidates.map((candidate, index) => (
                            <Button className="flex-1" 
                            variant={selectedCandidate === candidate ? "default" : "outline"}
                            onClick={() => setSelectedCandidate(candidate)} key={index}>{candidate}</Button>
                        ))
                    )}
                </div>
                <Button onClick={handleSubmit} className="flex-1">{isVoting ? "Voting..." : "Cast Vote"}</Button>
            </DialogContent>
        </Dialog>
    )
}

export default VoteModal;