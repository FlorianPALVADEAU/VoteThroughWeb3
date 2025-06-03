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

type AddCandidateModalProps = {
  isOpen: boolean
  setOpen: (open: boolean) => void
}

export function AddCandidateModal(props: AddCandidateModalProps) {
    const { addCandidate } = useWallet()

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        console.log('Form submitted');
        event.preventDefault()
        
        const nameInput = event.currentTarget.elements.namedItem("name") as HTMLInputElement | null
        const name = nameInput?.value.trim() ?? ""
        if (!name) {
            alert("Candidate name cannot be empty")
            return
        }
        addCandidate(name)
        event.currentTarget.reset()
    }

    return (
        <Dialog open={props.isOpen} onOpenChange={props.setOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle>Add Candidate to vote</DialogTitle>
            <DialogDescription>
                Add candidate to the vote list. Click save when you're done.
            </DialogDescription>
            </DialogHeader>
            
            {/* 🟢 Le formulaire commence ici */}
            <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-3">
                <Label htmlFor="candidate-name">Candidate Name</Label>
                <Input id="candidate-name" name="name" defaultValue="John Doe" />
            </div>

            <DialogFooter className="mt-4">
                <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save changes</Button>
            </DialogFooter>
            </form>
        </DialogContent>
        </Dialog>

    )
}
