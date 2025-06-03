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
import confetti from "canvas-confetti";
import { useEffect, useState } from "react"
import { Card } from "./ui/card";

type DisplayResultsModalProps = {
  isOpen: boolean
  setOpen: (open: boolean) => void
}

export function DisplayResultsModal(props: DisplayResultsModalProps) {
    const [displayWinner, setDisplayWinner] = useState<boolean>(false)
    // const { winner, isOwner } = useWallet()
    const winner = "John Doe"; 
    const isOwner = true;

    const handleClose = () => {
        props.setOpen(false)
        setDisplayWinner(false);
    }

    const handleTriggerConfettis = () => {
        const end = Date.now() + 3 * 1000; // 3 seconds
        const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

        const frame = () => {
        if (Date.now() > end) return;

        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            startVelocity: 60,
            origin: { x: 0, y: 0.5 },
            colors: colors,
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            startVelocity: 60,
            origin: { x: 1, y: 0.5 },
            colors: colors,
        });

        requestAnimationFrame(frame);
        };

        frame();
    };

    useEffect(() => {
        if (!props.isOpen) {
            setDisplayWinner(false);
            return;
        }
        setTimeout(() => {
            handleTriggerConfettis();
            setDisplayWinner(true);
        }, 1000);
    }, [props.isOpen]);

    return (
        <>
            <Dialog open={props.isOpen} onOpenChange={props.setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Vote Results</DialogTitle>
                        <DialogDescription>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <Card className="flex flex-col items-center justify-center p-6 space-y-4 border-none shadow-none">
                        <h6>And the winner is...</h6>
                        {
                            displayWinner && (
                                <>
                                    <div className="flex items-center justify-start gap-2">
                                        <img
                                            src="/assets/trophyIcon.png"
                                            alt="Trophy"
                                            className="w-24 h-24 object-contain"
                                        />
                                    </div>
                                    <p className="text-2xl font-black">{winner.toUpperCase()}</p>
                                </>
                            )
                        }
                    </Card>

                    <DialogFooter className="mt-4">
                        {
                            isOwner && (
                                <Button type="button" onClick={handleClose}>Restart a new vote</Button>

                            )
                        }
                        <DialogClose asChild>
                            <Button variant="outline" type="button" onClick={handleClose}>Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
