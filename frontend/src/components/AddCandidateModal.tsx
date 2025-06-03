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
import { useState } from "react"

type AddCandidateModalProps = {
  isOpen: boolean
  setOpen: (open: boolean) => void
}

export function AddCandidateModal(props: AddCandidateModalProps) {
    const { addCandidate } = useWallet()
    const [isAdding, setIsAdding] = useState(false)
    const [candidateName, setCandidateName] = useState("")

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        
        const name = candidateName.trim()
        if (!name) {
            alert("Candidate name cannot be empty")
            return
        }

        try {
            setIsAdding(true)
            await addCandidate(name)
            
            setCandidateName("")
            props.setOpen(false)
            
            console.log(`✅ Candidate "${name}" added successfully!`)
            
        } catch (error) {
            console.error("Error adding candidate:", error)
            alert("Error adding candidate. Please try again.")
        } finally {
            setIsAdding(false)
        }
    }

    const handleClose = () => {
        if (!isAdding) {
            setCandidateName("")
            props.setOpen(false)
        }
    }

    return (
        <Dialog open={props.isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Candidate to vote</DialogTitle>
                    <DialogDescription>
                        Add a new candidate to the voting list. The candidate will appear immediately after adding.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="candidate-name">Candidate Name</Label>
                        <Input 
                            id="candidate-name" 
                            name="name" 
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                            placeholder="Enter candidate name"
                            disabled={isAdding}
                            autoFocus
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button 
                                variant="outline" 
                                type="button" 
                                disabled={isAdding}
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button 
                            type="submit" 
                            disabled={isAdding || !candidateName.trim()}
                            className="min-w-[120px]"
                        >
                            {isAdding ? "Adding..." : "Add Candidate"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}