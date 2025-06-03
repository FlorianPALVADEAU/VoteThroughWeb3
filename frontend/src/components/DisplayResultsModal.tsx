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
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";

type DisplayResultsModalProps = {
  isOpen: boolean
  setOpen: (open: boolean) => void
  winner: string | null
  onRestart: () => void
}

export function DisplayResultsModal(props: DisplayResultsModalProps) {
    const [displayWinner, setDisplayWinner] = useState<boolean>(false);
    const { isOwner } = useWallet();

    const handleClose = () => {
        props.setOpen(false);
        setDisplayWinner(false);
    }

    const handleRestart = async () => {
        try {
            await props.onRestart();
            handleClose();
        } catch (error) {
            console.error("Error restarting vote:", error);
        }
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
        if (!props.isOpen || !props.winner) {
            setDisplayWinner(false);
            return;
        }
        
        const timer = setTimeout(() => {
            handleTriggerConfettis();
            setDisplayWinner(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, [props.isOpen, props.winner]);

    if (!props.winner) {
        return null;
    }

    return (
        <>
            <Dialog open={props.isOpen} onOpenChange={props.setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>🎉 Vote Results</DialogTitle>
                        <DialogDescription>
                            The voting has concluded with a clear winner!
                        </DialogDescription>
                    </DialogHeader>
                    
                    <Card className="flex flex-col items-center justify-center p-6 space-y-4 border-none shadow-none">
                        <h6 className="text-lg text-muted-foreground">And the winner is...</h6>
                        {displayWinner && (
                            <>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="text-6xl">🏆</div>
                                </div>
                                <p className="text-2xl font-black text-center text-gold">
                                    {props.winner.toUpperCase()}
                                </p>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Congratulations to the winner!
                                    </p>
                                </div>
                            </>
                        )}
                        {!displayWinner && (
                            <div className="flex items-center justify-center">
                                <div className="animate-pulse text-4xl">🎊</div>
                            </div>
                        )}
                    </Card>

                    <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
                        {isOwner && (
                            <Button 
                                type="button" 
                                onClick={handleRestart}
                                className="w-full sm:w-auto"
                            >
                                🔄 Start New Vote
                            </Button>
                        )}
                        <DialogClose asChild>
                            <Button 
                                variant="outline" 
                                type="button" 
                                onClick={handleClose}
                                className="w-full sm:w-auto"
                            >
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}