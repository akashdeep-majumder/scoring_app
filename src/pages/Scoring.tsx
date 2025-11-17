import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Eye, Film } from 'lucide-react';
import { formatOvers, calculateStrikeRate, getTotalBalls } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import InningsSummary from '../components/InningsSummary';
import type { BatsmanStats, BowlerStats, Ball, FallOfWicket, Innings } from '../types';

const Scoring: React.FC = () => {
  const navigate = useNavigate();
  const { currentMatch, updateMatch, ads, tournaments } = useApp();

  const [striker, setStriker] = useState<BatsmanStats | null>(null);
  const [nonStriker, setNonStriker] = useState<BatsmanStats | null>(null);
  const [currentBowler, setCurrentBowler] = useState<BowlerStats | null>(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState<'striker' | 'non-striker' | 'bowler' | null>(null);
  const [showExtraInput, setShowExtraInput] = useState<'wide' | 'no-ball' | 'bye' | 'leg-bye' | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showBowlerChange, setShowBowlerChange] = useState(false);
  const [isAdBroadcasting, setIsAdBroadcasting] = useState(false);
  const [showInningsSummary, setShowInningsSummary] = useState(false);
  const [isFreeHit, setIsFreeHit] = useState(false);
  const [showOverthrowInput, setShowOverthrowInput] = useState(false);
  const [showWicketTypeDialog, setShowWicketTypeDialog] = useState(false);
  const [pendingWicketRuns, setPendingWicketRuns] = useState(0);
  const [showFielderSelect, setShowFielderSelect] = useState(false);
  const [selectedWicketType, setSelectedWicketType] = useState<string>('');
  const [undoCount, setUndoCount] = useState(0);
  const [pendingWideRuns, setPendingWideRuns] = useState(0);
  const [showWideRunOutInput, setShowWideRunOutInput] = useState(false);
  const [pendingNoBallRuns, setPendingNoBallRuns] = useState(0);
  const [showNoBallRunOutInput, setShowNoBallRunOutInput] = useState(false);
  const [pendingByeRuns, setPendingByeRuns] = useState(0);
  const [showByeRunOutInput, setShowByeRunOutInput] = useState(false);
  const [pendingLegByeRuns, setPendingLegByeRuns] = useState(0);
  const [showLegByeRunOutInput, setShowLegByeRunOutInput] = useState(false);
  const [pendingExtraType, setPendingExtraType] = useState<'wide' | 'no-ball' | 'bye' | 'leg-bye' | null>(null);
  const [showBatsmanRunOutSelect, setShowBatsmanRunOutSelect] = useState(false);
  const [selectedRunOutBatsman, setSelectedRunOutBatsman] = useState<'striker' | 'non-striker' | null>(null);

  // New checkbox-based scoring system state
  const [selectedRuns, setSelectedRuns] = useState<number | null>(null);
  const [isNoBall, setIsNoBall] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [isBye, setIsBye] = useState(false);
  const [isLegBye, setIsLegBye] = useState(false);
  const [isOverthrow, setIsOverthrow] = useState(false);
  const [overthrowRuns, setOverthrowRuns] = useState(0);
  const [previousOverBowlerId, setPreviousOverBowlerId] = useState<string | null>(null);

  // Helper: Clear all scoring selections
  const clearScoringSelections = () => {
    setSelectedRuns(null);
    setIsNoBall(false);
    setIsWide(false);
    setIsBye(false);
    setIsLegBye(false);
    setIsOverthrow(false);
    setOverthrowRuns(0);
  };

  // Helper: Generate auto-commentary for a ball
  const generateCommentary = (params: {
    batsman: string;
    bowler: string;
    batsmanRuns: number;
    extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
    extraRuns: number;
    overthrowRuns: number;
    isWicket: boolean;
    wicketType?: string;
    fielder?: string;
    outPlayer?: string;
  }): string => {
    const { batsman, bowler, batsmanRuns, extraType, extraRuns, overthrowRuns, isWicket, wicketType, fielder, outPlayer } = params;

    if (isWicket) {
      if (wicketType === 'caught') {
        return `OUT! ${outPlayer || batsman} caught by ${fielder || 'fielder'} (bowled by ${bowler})`;
      } else if (wicketType === 'run-out') {
        return `OUT! ${outPlayer || batsman} run out by ${fielder || 'fielder'}`;
      } else if (wicketType === 'bowled') {
        return `OUT! ${outPlayer || batsman} bowled by ${bowler}`;
      } else if (wicketType === 'lbw') {
        return `OUT! ${outPlayer || batsman} LBW (bowled by ${bowler})`;
      } else if (wicketType === 'stumped') {
        return `OUT! ${outPlayer || batsman} stumped by ${fielder || 'keeper'} (bowled by ${bowler})`;
      } else {
        return `OUT! ${outPlayer || batsman} ${wicketType || 'dismissed'} (bowled by ${bowler})`;
      }
    }

    let commentary = '';
    const totalRuns = batsmanRuns + extraRuns + overthrowRuns;

    if (extraType === 'wide') {
      if (overthrowRuns > 0) {
        commentary = `Wide + ${extraRuns} byes + ${overthrowRuns} overthrow (${totalRuns + 1} total) - ${bowler}`;
      } else if (extraRuns > 0) {
        commentary = `Wide + ${extraRuns} byes (${totalRuns + 1} total) - ${bowler}`;
      } else {
        commentary = `Wide (1 run) - ${bowler}`;
      }
    } else if (extraType === 'no-ball') {
      if (batsmanRuns > 0) {
        if (overthrowRuns > 0) {
          commentary = `No Ball, ${batsman} hit ${batsmanRuns} runs + ${overthrowRuns} overthrow (${totalRuns + 1} total) - ${bowler}`;
        } else {
          commentary = `No Ball, ${batsman} hit ${batsmanRuns} runs (${totalRuns + 1} total) - ${bowler}`;
        }
      } else {
        commentary = `No Ball (1 run) - ${bowler}`;
      }
    } else if (extraType === 'bye') {
      if (overthrowRuns > 0) {
        commentary = `Bye ${batsmanRuns} runs + ${overthrowRuns} overthrow (${totalRuns} total) - ${bowler}`;
      } else {
        commentary = `Bye ${batsmanRuns} runs - ${bowler}`;
      }
    } else if (extraType === 'leg-bye') {
      if (overthrowRuns > 0) {
        commentary = `Leg Bye ${batsmanRuns} runs + ${overthrowRuns} overthrow (${totalRuns} total) - ${bowler}`;
      } else {
        commentary = `Leg Bye ${batsmanRuns} runs - ${bowler}`;
      }
    } else {
      // Normal delivery
      if (overthrowRuns > 0) {
        commentary = `${batsman} hit ${batsmanRuns} runs + ${overthrowRuns} overthrow (${totalRuns} total) - ${bowler}`;
      } else if (batsmanRuns === 0) {
        commentary = `Dot ball - ${bowler} to ${batsman}`;
      } else if (batsmanRuns === 4) {
        commentary = `FOUR! ${batsman} hit ${batsmanRuns} runs (bowled by ${bowler})`;
      } else if (batsmanRuns === 6) {
        commentary = `SIX! ${batsman} hit ${batsmanRuns} runs (bowled by ${bowler})`;
      } else {
        commentary = `${batsman} hit ${batsmanRuns} runs (bowled by ${bowler})`;
      }
    }

    return commentary;
  };

  // Checkbox handlers with mutual exclusivity
  const handleNoBallToggle = () => {
    const newValue = !isNoBall;
    setIsNoBall(newValue);
    if (newValue && isWide) {
      setIsWide(false); // No Ball and Wide are mutually exclusive
    }
  };

  const handleWideToggle = () => {
    const newValue = !isWide;
    setIsWide(newValue);
    if (newValue) {
      setIsNoBall(false); // No Ball and Wide are mutually exclusive
      // Auto-select Bye when Wide is selected
      if (selectedRuns !== null && selectedRuns > 0) {
        setIsBye(true);
        setIsLegBye(false);
      }
    }
  };

  const handleByeToggle = () => {
    const newValue = !isBye;
    setIsBye(newValue);
    if (newValue && isLegBye) {
      setIsLegBye(false); // Bye and Leg Bye are mutually exclusive
    }
  };

  const handleLegByeToggle = () => {
    const newValue = !isLegBye;
    setIsLegBye(newValue);
    if (newValue && isBye) {
      setIsBye(false); // Bye and Leg Bye are mutually exclusive
    }
  };

  const handleRunsSelection = (runs: number) => {
    setSelectedRuns(runs);
    // If Wide is checked and runs > 0, auto-select Bye
    if (isWide && runs > 0) {
      setIsBye(true);
      setIsLegBye(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Number keys (0-6) for runs
      if (e.key >= '0' && e.key <= '6') {
        const run = parseInt(e.key);
        handleRunsSelection(run);
        e.preventDefault();
      }

      // Letter keys for extras
      switch (e.key.toLowerCase()) {
        case 'w':
          handleWideToggle();
          e.preventDefault();
          break;
        case 'n':
          handleNoBallToggle();
          e.preventDefault();
          break;
        case 'b':
          handleByeToggle();
          e.preventDefault();
          break;
        case 'l':
          handleLegByeToggle();
          e.preventDefault();
          break;
        case 'o':
          setIsOverthrow(!isOverthrow);
          e.preventDefault();
          break;
        case 'enter':
        case ' ': // Spacebar
          if (selectedRuns !== null) {
            handleRecordBall();
            e.preventDefault();
          }
          break;
        case 'escape':
          clearScoringSelections();
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedRuns, isNoBall, isWide, isBye, isLegBye, isOverthrow]);

  // Restore current batsmen and bowler from match data when component mounts or match changes
  useEffect(() => {
    if (!currentMatch) return;

    const currentInnings = currentMatch.innings[currentMatch.currentInnings - 1];
    if (!currentInnings) return;

    // Find current batsmen (those not out)
    const currentStriker = currentInnings.batsmen.find(b => b.isOnStrike && !b.isOut);
    const currentNonStriker = currentInnings.batsmen.find(b => !b.isOnStrike && !b.isOut);

    // Find current bowler (the last bowler in the list)
    const latestBowler = currentInnings.bowlers.length > 0
      ? currentInnings.bowlers[currentInnings.bowlers.length - 1]
      : null;

    if (currentStriker) setStriker(currentStriker);
    if (currentNonStriker) setNonStriker(currentNonStriker);
    if (latestBowler) setCurrentBowler(latestBowler);
  }, [currentMatch]);

  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No active match</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg"
          >
            Go to Tournaments
          </button>
        </div>
      </div>
    );
  }

  const currentInnings = currentMatch.innings[currentMatch.currentInnings - 1];
  const battingTeam = currentMatch.team1.id === currentInnings.battingTeamId ? currentMatch.team1 : currentMatch.team2;
  const bowlingTeam = currentMatch.team1.id === currentInnings.bowlingTeamId ? currentMatch.team1 : currentMatch.team2;

  // Get tournament to check format (6v6, 8v8, etc.)
  const tournament = tournaments.find(t => t.id === currentMatch.tournamentId);
  const playersPerTeam = tournament?.playersPerTeam || 11; // Default to 11 if not found
  const maxWickets = playersPerTeam - 1; // e.g., 6v6 = 5 wickets, 8v8 = 7 wickets, 11v11 = 10 wickets

  // New recordBall function using checkbox system
  const handleRecordBall = async (params?: { isWicket?: boolean; wicketType?: string; fielderId?: string; outBatsmanId?: string }) => {
    const isWicket = params?.isWicket || false;
    const wicketType = params?.wicketType;
    const fielderId = params?.fielderId;
    const outBatsmanId = params?.outBatsmanId;

    // Validation: Must have runs selected
    if (selectedRuns === null) {
      toast.error('Please select runs before recording the ball');
      return;
    }

    // Validation: Batsmen and bowler must be selected
    if (!striker || !nonStriker || !currentBowler) {
      toast.error('Please select both batsmen and bowler before scoring');
      return;
    }

    // Validation: Match must not be completed
    if (currentMatch.status === 'completed') {
      toast.error('Match is already completed');
      return;
    }

    // Validation: Mutual exclusivity - No Ball OR Wide (not both)
    if (isNoBall && isWide) {
      toast.error('Cannot have both No Ball and Wide on the same delivery');
      return;
    }

    // Validation: Bye and Leg Bye cannot both be selected
    if (isBye && isLegBye) {
      toast.error('Cannot have both Bye and Leg Bye on the same delivery');
      return;
    }

    // Auto-select Bye when Wide + runs
    let effectiveIsBye = isBye;
    if (isWide && selectedRuns > 0) {
      effectiveIsBye = true;
    }

    // Determine extra type
    let extraType: 'wide' | 'no-ball' | 'bye' | 'leg-bye' | undefined;
    if (isWide) extraType = 'wide';
    else if (isNoBall) extraType = 'no-ball';
    else if (effectiveIsBye) extraType = 'bye';
    else if (isLegBye) extraType = 'leg-bye';

    // Calculate runs breakdown
    let batsmanRuns = 0;
    let extraRuns = 0;
    let totalRuns = 0;

    if (isWide) {
      // Wide: NO runs to batsman, 1 penalty + selected runs (as byes)
      batsmanRuns = 0;
      extraRuns = 1 + selectedRuns; // 1 wide penalty + bye runs
      totalRuns = extraRuns + overthrowRuns;
    } else if (isNoBall) {
      if (effectiveIsBye || isLegBye) {
        // No Ball + Bye/Leg Bye: NO runs to batsman, 1 penalty + bye/legbye runs
        batsmanRuns = 0;
        extraRuns = 1 + selectedRuns;
        totalRuns = extraRuns + overthrowRuns;
      } else {
        // No Ball + batsman runs: Runs to batsman, 1 penalty
        batsmanRuns = selectedRuns;
        extraRuns = 1; // Just the no-ball penalty
        totalRuns = batsmanRuns + extraRuns + overthrowRuns;
      }
    } else if (effectiveIsBye || isLegBye) {
      // Bye/Leg Bye: NO runs to batsman
      batsmanRuns = 0;
      extraRuns = selectedRuns;
      totalRuns = extraRuns + overthrowRuns;
    } else {
      // Normal delivery: Runs to batsman
      batsmanRuns = selectedRuns;
      extraRuns = 0;
      totalRuns = batsmanRuns + overthrowRuns;
    }

    const updatedInnings = { ...currentInnings };

    // Check innings limits
    const totalBalls = getTotalBalls(currentInnings.overs, currentInnings.balls);
    const maxBalls = currentMatch.overs * 6;

    if (currentInnings.wickets >= maxWickets) {
      toast.error(`All out! ${maxWickets} wickets down`);
      return;
    }

    if (totalBalls >= maxBalls) {
      toast.error('Overs complete! Innings finished');
      return;
    }

    // Check target in 2nd innings
    if (currentMatch.currentInnings === 2) {
      const target = currentMatch.innings[0].runs + 1;
      if (currentInnings.runs >= target) {
        toast.error('Target already achieved');
        return;
      }
    }

    // Update innings total
    updatedInnings.runs += totalRuns;

    // Update extras
    if (isWide) {
      updatedInnings.extras.wides += 1;
      if (selectedRuns > 0) {
        updatedInnings.extras.byes += selectedRuns;
      }
      if (overthrowRuns > 0) {
        updatedInnings.extras.byes += overthrowRuns;
      }
    } else if (isNoBall) {
      updatedInnings.extras.noBalls += 1;
      if (effectiveIsBye) {
        updatedInnings.extras.byes += selectedRuns;
        if (overthrowRuns > 0) {
          updatedInnings.extras.byes += overthrowRuns;
        }
      } else if (isLegBye) {
        updatedInnings.extras.legByes += selectedRuns;
        if (overthrowRuns > 0) {
          updatedInnings.extras.byes += overthrowRuns;
        }
      } else if (overthrowRuns > 0) {
        updatedInnings.extras.byes += overthrowRuns;
      }
    } else if (effectiveIsBye) {
      updatedInnings.extras.byes += selectedRuns;
      if (overthrowRuns > 0) {
        updatedInnings.extras.byes += overthrowRuns;
      }
    } else if (isLegBye) {
      updatedInnings.extras.legByes += selectedRuns;
      if (overthrowRuns > 0) {
        updatedInnings.extras.byes += overthrowRuns;
      }
    } else if (overthrowRuns > 0) {
      updatedInnings.extras.byes += overthrowRuns;
    }

    // Update batsman stats (only if batsman scored runs)
    const strikerIndex = updatedInnings.batsmen.findIndex(b => b.playerId === striker.playerId);
    if (strikerIndex >= 0 && batsmanRuns > 0) {
      updatedInnings.batsmen[strikerIndex].runs += batsmanRuns;

      if (batsmanRuns === 4) updatedInnings.batsmen[strikerIndex].fours += 1;
      if (batsmanRuns === 6) updatedInnings.batsmen[strikerIndex].sixes += 1;
    }

    // Update balls faced (valid balls only + no-balls)
    const validBall = !extraType || extraType === 'bye' || extraType === 'leg-bye';
    if (strikerIndex >= 0 && (validBall || isNoBall)) {
      updatedInnings.batsmen[strikerIndex].balls += 1;
      updatedInnings.batsmen[strikerIndex].strikeRate = calculateStrikeRate(
        updatedInnings.batsmen[strikerIndex].runs,
        updatedInnings.batsmen[strikerIndex].balls
      );
    }

    // Mark batsman as out
    if (isWicket) {
      const outBatsmanIndex = outBatsmanId
        ? updatedInnings.batsmen.findIndex(b => b.playerId === outBatsmanId)
        : strikerIndex;

      if (outBatsmanIndex >= 0) {
        updatedInnings.batsmen[outBatsmanIndex].isOut = true;
        updatedInnings.batsmen[outBatsmanIndex].isOnStrike = false;
      }
    }

    // Update bowler stats
    const bowlerIndex = updatedInnings.bowlers.findIndex(b => b.playerId === currentBowler.playerId);
    if (bowlerIndex >= 0) {
      if (validBall) {
        updatedInnings.bowlers[bowlerIndex].balls += 1;
        updatedInnings.bowlers[bowlerIndex].overs = parseFloat(formatOvers(updatedInnings.bowlers[bowlerIndex].balls));
      }
      updatedInnings.bowlers[bowlerIndex].runs += totalRuns;
      if (isWicket) updatedInnings.bowlers[bowlerIndex].wickets += 1;

      const totalBowlerBalls = updatedInnings.bowlers[bowlerIndex].balls;
      if (totalBowlerBalls > 0) {
        const economy = (updatedInnings.bowlers[bowlerIndex].runs / (totalBowlerBalls / 6));
        updatedInnings.bowlers[bowlerIndex].economy = parseFloat(economy.toFixed(2));
      }
    }

    // Generate commentary
    const commentary = generateCommentary({
      batsman: striker.playerName,
      bowler: currentBowler.playerName,
      batsmanRuns,
      extraType,
      extraRuns,
      overthrowRuns,
      isWicket,
      wicketType,
      fielder: fielderId,
      outPlayer: outBatsmanId ? updatedInnings.batsmen.find(b => b.playerId === outBatsmanId)?.playerName : striker.playerName
    });

    // Record ball
    const currentOverNumber = updatedInnings.overs + 1;
    const currentBallNumber = updatedInnings.balls + 1;

    const ball: Ball = {
      over: currentOverNumber,
      ball: currentBallNumber,
      batsman: striker.playerName,
      nonStriker: nonStriker.playerName,
      bowler: currentBowler.playerName,
      runs: totalRuns,
      totalRuns,
      batsmanRuns,
      extraRuns,
      overthrowRuns,
      isWicket,
      isExtra: !!extraType,
      extraType,
      wicketType: isWicket ? (wicketType as any) : undefined,
      outPlayer: isWicket ? (outBatsmanId ? updatedInnings.batsmen.find(b => b.playerId === outBatsmanId)?.playerName : striker.playerName) : undefined,
      fielderId,
      commentary,
      isFreeHit: false
    };

    updatedInnings.ballByBall.push(ball);

    // Update ball count
    const overComplete = validBall && (updatedInnings.balls + 1) % 6 === 0;
    if (validBall) {
      updatedInnings.balls += 1;
      if (updatedInnings.balls % 6 === 0) {
        updatedInnings.overs += 1;
        updatedInnings.balls = 0;
      }
    }

    // Update wickets
    if (isWicket) {
      updatedInnings.wickets += 1;

      const fallOfWicket: FallOfWicket = {
        wicketNumber: updatedInnings.wickets,
        playerOut: outBatsmanId ? updatedInnings.batsmen.find(b => b.playerId === outBatsmanId)?.playerName || striker.playerName : striker.playerName,
        runs: updatedInnings.runs,
        overs: updatedInnings.overs,
        balls: updatedInnings.balls,
        howOut: wicketType || 'caught',
        bowler: currentBowler.playerName,
        fielder: fielderId
      };

      if (!updatedInnings.fallOfWickets) {
        updatedInnings.fallOfWickets = [];
      }
      updatedInnings.fallOfWickets.push(fallOfWicket);

      const activePartnership = updatedInnings.partnerships?.find(p => p.isActive);
      if (activePartnership) {
        activePartnership.isActive = false;
      }
    }

    // Track partnerships
    if (!isWicket && totalRuns > 0) {
      if (!updatedInnings.partnerships) {
        updatedInnings.partnerships = [];
      }

      let activePartnership = updatedInnings.partnerships.find(p => p.isActive);

      if (!activePartnership ||
          (activePartnership.batsman1 !== striker.playerName &&
           activePartnership.batsman2 !== striker.playerName) ||
          (activePartnership.batsman1 !== nonStriker.playerName &&
           activePartnership.batsman2 !== nonStriker.playerName)) {
        activePartnership = {
          batsman1: striker.playerName,
          batsman2: nonStriker.playerName,
          runs: 0,
          balls: 0,
          isActive: true
        };
        updatedInnings.partnerships.push(activePartnership);
      }

      activePartnership.runs += totalRuns;
      if (validBall) {
        activePartnership.balls += 1;
      }
    }

    // Strike rotation
    let shouldRotateStrike = false;

    if (isWicket && wicketType === 'run-out') {
      shouldRotateStrike = selectedRuns % 2 === 1;
    } else if (!isWicket) {
      shouldRotateStrike = selectedRuns % 2 === 1 && validBall;
    }

    if (shouldRotateStrike) {
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);

      updatedInnings.batsmen = updatedInnings.batsmen.map(b => ({
        ...b,
        isOnStrike: b.playerId === nonStriker.playerId
      }));
    }

    // End of over strike change
    if (overComplete && !isWicket) {
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);

      updatedInnings.batsmen = updatedInnings.batsmen.map(b => ({
        ...b,
        isOnStrike: b.playerId === (shouldRotateStrike ? striker.playerId : nonStriker.playerId)
      }));

      toast.info(`Over complete! Strike changed`, { autoClose: 2000 });
    }

    // Update match
    const updatedMatch = { ...currentMatch };
    updatedMatch.innings[currentMatch.currentInnings - 1] = updatedInnings;

    // Check target achieved
    if (currentMatch.currentInnings === 2) {
      const target = currentMatch.innings[0].runs + 1;
      if (updatedInnings.runs >= target) {
        updatedMatch.status = 'completed';
        const battingSecond = updatedInnings.battingTeamId === currentMatch.team1.id ? currentMatch.team1 : currentMatch.team2;
        const wicketsRemaining = maxWickets - updatedInnings.wickets;
        toast.success(`${battingSecond.name} won by ${wicketsRemaining} wickets!`, { autoClose: 10000 });

        await updateMatch(updatedMatch);
        clearScoringSelections();
        return;
      }
    }

    // Check innings end
    const totalBallsInInnings = getTotalBalls(updatedInnings.overs, updatedInnings.balls);
    if (updatedInnings.wickets >= maxWickets || totalBallsInInnings >= maxBalls) {
      if (updatedInnings.wickets >= maxWickets) {
        updatedInnings.isAllOut = true;
      }

      if (currentMatch.currentInnings === 1) {
        updatedMatch.currentInnings = 2;
        const secondInnings: Innings = {
          battingTeamId: currentInnings.bowlingTeamId,
          bowlingTeamId: currentInnings.battingTeamId,
          runs: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0 },
          batsmen: [],
          bowlers: [],
          ballByBall: [],
          fallOfWickets: [],
          partnerships: [],
          targetScore: updatedInnings.runs + 1,
          isDeclared: false,
          isAllOut: false
        };
        updatedMatch.innings.push(secondInnings);
        setStriker(null);
        setNonStriker(null);
        setCurrentBowler(null);
        setShowInningsSummary(true);
        toast.success('First innings complete!');
      } else {
        updatedMatch.status = 'completed';
        const firstInnings = updatedMatch.innings[0];
        const secondInnings = updatedMatch.innings[1];
        const battingFirst = firstInnings.battingTeamId === currentMatch.team1.id ? currentMatch.team1 : currentMatch.team2;
        const battingSecond = secondInnings.battingTeamId === currentMatch.team1.id ? currentMatch.team1 : currentMatch.team2;

        let resultMessage = '';
        if (secondInnings.runs > firstInnings.runs) {
          const wicketsRemaining = maxWickets - secondInnings.wickets;
          resultMessage = `${battingSecond.name} won by ${wicketsRemaining} wickets`;
        } else if (firstInnings.runs > secondInnings.runs) {
          const runsMargin = firstInnings.runs - secondInnings.runs;
          resultMessage = `${battingFirst.name} won by ${runsMargin} runs`;
        } else {
          resultMessage = 'Match Tied!';
        }
        toast.success(`Match Complete! ${resultMessage}`, { autoClose: 10000 });
      }
    }

    // Handle wicket
    if (isWicket) {
      if (outBatsmanId === striker.playerId || !outBatsmanId) {
        setStriker(null);
      } else if (outBatsmanId === nonStriker.playerId) {
        setNonStriker(null);
      }

      toast.success(`Wicket! Please select next batsman.`, { autoClose: 4000 });
    }

    // Bowler change after over
    if (overComplete && !isWicket && updatedInnings.wickets < maxWickets && totalBallsInInnings < maxBalls) {
      setShowBowlerChange(true);
      // Store previous bowler ID before clearing
      setPreviousOverBowlerId(currentBowler.playerId);
      setCurrentBowler(null);
      toast.success('Over complete! Select new bowler.', { autoClose: 3000 });
    }

    clearScoringSelections();

    try {
      await updateMatch(updatedMatch);
    } catch (error) {
      console.error('Failed to update match:', error);
      toast.error('Failed to record ball');
    }
  };

  // Old recordBall function for backwards compatibility with existing modals
  const recordBall = async (runs: number, isWicket: boolean = false, extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye', extraRuns: number = 0, wicketType?: string, fielderName?: string, noStrikeChange: boolean = false, outBatsmanId?: string) => {
    // Cricket Rule Validations

    // NO FREE HIT in this tournament format - rule removed

    // 1. Check if batsmen and bowler are selected
    if (!striker || !currentBowler) {
      toast.error('Please select batsmen and bowler before scoring');
      return;
    }

    // 2. Check if match is already complete
    if (currentMatch.status === 'completed') {
      toast.error('Match is already completed. Cannot score more balls.');
      return;
    }

    // 3. Check if innings is complete (all wickets down or overs complete)
    const totalBalls = getTotalBalls(currentInnings.overs, currentInnings.balls);
    const maxBalls = currentMatch.overs * 6;

    if (currentInnings.wickets >= maxWickets) {
      toast.error(`All out! ${maxWickets} wickets down. Innings is complete.`);
      return;
    }

    if (totalBalls >= maxBalls) {
      toast.error('Overs complete! Innings is finished.');
      return;
    }

    // 4. Validate runs (can't score more than 6 on a normal ball)
    if (!extraType && runs > 6) {
      toast.error('Invalid runs! Cannot score more than 6 runs on a single ball.');
      return;
    }

    // 5. Check if bowler from same team as batsman (shouldn't happen)
    if (currentBowler.playerId === striker.playerId || currentBowler.playerId === nonStriker?.playerId) {
      toast.error('Invalid! Bowler cannot be one of the batsmen.');
      return;
    }

    // 6. Validate that we have at least 2 batsmen if not all out
    const activeBatsmen = currentInnings.batsmen.filter(b => !b.isOut);
    if (activeBatsmen.length < 2 && currentInnings.wickets < 10) {
      toast.error('Please select both batsmen before scoring');
      return;
    }

    // 7. If it's a wicket, check if there are more batsmen available
    if (isWicket) {
      const batsmenRemaining = battingTeam.players.length - currentInnings.batsmen.length;
      if (batsmenRemaining === 0 && currentInnings.wickets >= 9) {
        // This will be the last wicket - all out
        console.log('Last wicket - team will be all out');
      }
    }

    // 8. Check if second innings target is already achieved
    if (currentMatch.currentInnings === 2) {
      const target = currentMatch.innings[0].runs + 1;
      if (currentInnings.runs >= target) {
        toast.error('Target already achieved! Match is complete.');
        return;
      }
    }

    // 9. Check bowler's over limit (can't bowl more than 20% of total overs)
    const maxOversPerBowler = Math.ceil(currentMatch.overs / 5); // 20% of total overs (always round up)
    const bowlerBalls = currentBowler.balls || 0;
    const bowlerOversCompleted = Math.floor(bowlerBalls / 6);
    const bowlerBallsInCurrentOver = bowlerBalls % 6;

    // Check if this ball will complete the current over
    const isExtra = !!extraType;
    const validBall = !isExtra || extraType === 'bye' || extraType === 'leg-bye';
    const willCompleteOver = validBall && bowlerBallsInCurrentOver === 5; // 6th ball completes the over

    if (willCompleteOver && bowlerOversCompleted >= maxOversPerBowler - 1) {
      toast.error(`Bowler ${currentBowler.playerName} has bowled maximum overs (${maxOversPerBowler}). Please select a different bowler for the next over.`);
      // Still allow the ball but show warning
    }

    const updatedInnings = { ...currentInnings };

    // SPECIAL RULE: 6 is OUT
    // If batsman hits 6, they are out and team gets 0 runs
    // Exception: On no-ball, batsman is still out but team gets 1 run (no-ball penalty)
    if (runs === 6 && isWicket) {
      if (extraType === 'no-ball') {
        // No-ball + 6: batsman out, team gets only 1 run (no-ball penalty)
        runs = 0;
        extraRuns = 0;
      } else {
        // Normal 6: batsman out, team gets 0 runs
        runs = 0;
      }
    }

    // Calculate total runs to add to innings score
    let totalRunsToAdd = runs;
    if (extraType === 'wide' || extraType === 'no-ball') {
      totalRunsToAdd = runs + extraRuns + 1; // base runs + extra runs + 1 penalty
    } else if (extraType === 'bye' || extraType === 'leg-bye') {
      totalRunsToAdd = runs; // bye/legbye only count the runs scored
    }

    // Update innings total
    updatedInnings.runs += totalRunsToAdd;

    // Update extras
    if (extraType) {
      if (extraType === 'wide') {
        // Wide: 1 penalty to wides, any extra runs to byes
        updatedInnings.extras.wides += 1;
        if (extraRuns > 0) {
          updatedInnings.extras.byes += extraRuns;
        }
      } else if (extraType === 'no-ball') {
        updatedInnings.extras.noBalls += 1 + extraRuns; // no-ball penalty + any runs
      } else if (extraType === 'bye') {
        updatedInnings.extras.byes += runs;
      } else if (extraType === 'leg-bye') {
        updatedInnings.extras.legByes += runs;
      }
    }

    // Update batsman stats (only for normal balls and no-balls - NOT byes/leg-byes/wides)
    const strikerIndex = updatedInnings.batsmen.findIndex(b => b.playerId === striker.playerId);
    if (strikerIndex >= 0) {
      if (!extraType || extraType === 'no-ball') {
        // On no-ball, batsman gets runs but not the penalty run
        const batsmanRuns = (extraType === 'no-ball') ? runs + extraRuns : runs;
        updatedInnings.batsmen[strikerIndex].runs += batsmanRuns;

        // Count ball: valid deliveries (normal balls) AND no-balls
        // No-ball counts as ball faced, but wide doesn't
        if (validBall || extraType === 'no-ball') {
          updatedInnings.batsmen[strikerIndex].balls += 1;
        }

        if (batsmanRuns === 4) updatedInnings.batsmen[strikerIndex].fours += 1;
        // Note: 6 is not counted as it's OUT in local rules
        updatedInnings.batsmen[strikerIndex].strikeRate = calculateStrikeRate(
          updatedInnings.batsmen[strikerIndex].runs,
          updatedInnings.batsmen[strikerIndex].balls
        );
      }
    }

    // Mark batsman as out if wicket, regardless of extra type
    // Use outBatsmanId if provided (for run outs where non-striker is out)
    if (isWicket) {
      const outBatsmanIndex = outBatsmanId
        ? updatedInnings.batsmen.findIndex(b => b.playerId === outBatsmanId)
        : strikerIndex;

      if (outBatsmanIndex >= 0) {
        updatedInnings.batsmen[outBatsmanIndex].isOut = true;
        updatedInnings.batsmen[outBatsmanIndex].isOnStrike = false;
      }
    }

    // Update bowler stats
    const bowlerIndex = updatedInnings.bowlers.findIndex(b => b.playerId === currentBowler.playerId);
    if (bowlerIndex >= 0) {
      if (validBall) {
        updatedInnings.bowlers[bowlerIndex].balls += 1;
        updatedInnings.bowlers[bowlerIndex].overs = parseFloat(formatOvers(updatedInnings.bowlers[bowlerIndex].balls));
      }
      // Bowler concedes all runs (including penalty and extras)
      updatedInnings.bowlers[bowlerIndex].runs += totalRunsToAdd;

      if (isWicket) updatedInnings.bowlers[bowlerIndex].wickets += 1;

      const totalBalls = updatedInnings.bowlers[bowlerIndex].balls;
      if (totalBalls > 0) {
        const economy = (updatedInnings.bowlers[bowlerIndex].runs / (totalBalls / 6));
        updatedInnings.bowlers[bowlerIndex].economy = parseFloat(economy.toFixed(2));
      }
    }

    // Record ball BEFORE updating ball count (to capture current over/ball number)
    // In cricket, overs are 1-based (Over 1, Over 2, etc.) and balls are 1-6
    const currentOverNumber = updatedInnings.overs + 1; // Convert 0-based to 1-based
    const currentBallNumber = updatedInnings.balls + 1; // Convert 0-based to 1-based

    const ball: Ball = {
      over: currentOverNumber,
      ball: currentBallNumber,
      batsman: striker.playerName,
      nonStriker: nonStriker?.playerName || '',
      bowler: currentBowler.playerName,
      runs: totalRunsToAdd, // Total runs added to score
      totalRuns: totalRunsToAdd, // Total runs added to score
      batsmanRuns: extraType ? 0 : runs, // Runs credited to batsman
      extraRuns: extraType === 'wide' || extraType === 'no-ball' ? (1 + extraRuns) : 0,
      overthrowRuns: 0,
      isWicket,
      isExtra,
      extraType,
      wicketType: isWicket ? (wicketType as any) : undefined,
      outPlayer: isWicket ? striker.playerName : undefined,
      fielderId: fielderName,
      isFreeHit: isFreeHit,
      commentary: undefined
    };
    updatedInnings.ballByBall.push(ball);

    // Update ball count (only for valid deliveries)
    const overComplete = validBall && (updatedInnings.balls + 1) % 6 === 0;
    if (validBall) {
      updatedInnings.balls += 1;
      if (updatedInnings.balls % 6 === 0) {
        updatedInnings.overs += 1;
        updatedInnings.balls = 0;
      }
    }

    // Update wickets and record fall of wicket
    if (isWicket) {
      updatedInnings.wickets += 1;

      // Record fall of wicket
      const fallOfWicket: FallOfWicket = {
        wicketNumber: updatedInnings.wickets,
        playerOut: striker.playerName,
        runs: updatedInnings.runs,
        overs: updatedInnings.overs,
        balls: updatedInnings.balls,
        howOut: wicketType || 'caught',
        bowler: currentBowler.playerName,
        fielder: fielderName
      };

      if (!updatedInnings.fallOfWickets) {
        updatedInnings.fallOfWickets = [];
      }
      updatedInnings.fallOfWickets.push(fallOfWicket);

      // End current partnership when wicket falls
      if (!updatedInnings.partnerships) {
        updatedInnings.partnerships = [];
      }
      const activePartnership = updatedInnings.partnerships.find(p => p.isActive);
      if (activePartnership) {
        activePartnership.isActive = false;
      }
    }

    // Track partnerships (for runs scored by batsmen)
    if (!isWicket && striker && nonStriker && totalRunsToAdd > 0) {
      if (!updatedInnings.partnerships) {
        updatedInnings.partnerships = [];
      }

      // Find or create active partnership
      let activePartnership = updatedInnings.partnerships.find(p => p.isActive);

      if (!activePartnership ||
          (activePartnership.batsman1 !== striker.playerName &&
           activePartnership.batsman2 !== striker.playerName) ||
          (activePartnership.batsman1 !== nonStriker.playerName &&
           activePartnership.batsman2 !== nonStriker.playerName)) {
        // Create new partnership
        activePartnership = {
          batsman1: striker.playerName,
          batsman2: nonStriker.playerName,
          runs: 0,
          balls: 0,
          isActive: true
        };
        updatedInnings.partnerships.push(activePartnership);
      }

      // Update partnership stats
      activePartnership.runs += totalRunsToAdd;
      if (validBall) {
        activePartnership.balls += 1;
      }
    }

    // NO FREE HIT in this tournament format
    // Clear free hit if it was set from previous rules
    if (isFreeHit && validBall) {
      setIsFreeHit(false);
    }

    // Determine if strike should rotate
    let shouldRotateStrike = false;

    // If noStrikeChange is true, don't rotate strike at all
    if (!noStrikeChange) {
      // For run outs, strike rotates based on runs completed before dismissal
      if (isWicket && wicketType === 'run out') {
        if (extraType === 'bye' || extraType === 'leg-bye') {
          // For bye/legbye run out, rotate on odd runs
          shouldRotateStrike = runs % 2 === 1;
        } else if (extraType === 'wide') {
          // For wide run out, rotate if batsmen ran (extraRuns is odd)
          shouldRotateStrike = extraRuns % 2 === 1;
        } else if (extraType === 'no-ball') {
          // For no-ball run out, rotate if batsman runs are odd
          shouldRotateStrike = (runs + extraRuns) % 2 === 1;
        }
      } else if (!isWicket) {
        // Normal strike rotation for non-wicket balls
        if (extraType === 'bye' || extraType === 'leg-bye') {
          // For bye/legbye, rotate on odd runs
          shouldRotateStrike = runs % 2 === 1;
        } else if (extraType === 'wide') {
          // For wide, rotate if batsmen ran (extraRuns is odd)
          shouldRotateStrike = extraRuns % 2 === 1;
        } else if (extraType === 'no-ball') {
          // For no-ball, rotate if total batsman runs are odd
          shouldRotateStrike = (runs + extraRuns) % 2 === 1;
        } else {
          // Normal ball, rotate on odd runs
          shouldRotateStrike = runs % 2 === 1 && validBall;
        }
      }
    }

    // Rotate strike if needed (based on runs scored)
    if (shouldRotateStrike) {
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);

      // Update strike markers
      updatedInnings.batsmen = updatedInnings.batsmen.map(b => ({
        ...b,
        isOnStrike: b.playerId === nonStriker?.playerId
      }));
    }

    // Change strike at end of over (after 6 valid balls)
    // This happens AFTER any strike change from runs scored
    if (overComplete && !isWicket) {
      // If strike was already changed due to odd runs, this will change it back
      // If strike wasn't changed (even runs or dot ball), this will change it
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);

      // Update strike markers
      updatedInnings.batsmen = updatedInnings.batsmen.map(b => ({
        ...b,
        isOnStrike: b.playerId === (shouldRotateStrike ? striker?.playerId : nonStriker?.playerId)
      }));

      toast.info(`⚡ Over complete! Strike changed to ${shouldRotateStrike ? striker?.playerName : nonStriker?.playerName}`, { autoClose: 2000 });
    }

    // Update match
    const updatedMatch = { ...currentMatch };
    updatedMatch.innings[currentMatch.currentInnings - 1] = updatedInnings;

    // Check if target achieved in second innings
    if (currentMatch.currentInnings === 2) {
      const target = currentMatch.innings[0].runs + 1;
      if (updatedInnings.runs >= target) {
        // Target achieved - match complete
        updatedMatch.status = 'completed';

        const battingSecond = updatedInnings.battingTeamId === currentMatch.team1.id ? currentMatch.team1 : currentMatch.team2;
        const wicketsRemaining = maxWickets - updatedInnings.wickets;
        const resultMessage = `${battingSecond.name} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;

        toast.success(`Match Complete! ${resultMessage}`, { autoClose: 10000 });

        try {
          await updateMatch(updatedMatch);
        } catch (error) {
          console.error('Failed to update match:', error);
          toast.error('Failed to record ball. Please try again.');
        }
        return;
      }
    }

    // Check for innings end
    const totalBallsInInnings = getTotalBalls(updatedInnings.overs, updatedInnings.balls);

    if (updatedInnings.wickets >= maxWickets || totalBallsInInnings >= maxBalls) {
      // Mark innings as all out if applicable
      if (updatedInnings.wickets >= maxWickets) {
        updatedInnings.isAllOut = true;
      }

      if (currentMatch.currentInnings === 1) {
        // Start second innings
        updatedMatch.currentInnings = 2;
        const secondInnings: Innings = {
          battingTeamId: currentInnings.bowlingTeamId,
          bowlingTeamId: currentInnings.battingTeamId,
          runs: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0 },
          batsmen: [],
          bowlers: [],
          ballByBall: [],
          fallOfWickets: [],
          partnerships: [],
          targetScore: updatedInnings.runs + 1,
          isDeclared: false,
          isAllOut: false
        };
        updatedMatch.innings.push(secondInnings);
        setStriker(null);
        setNonStriker(null);
        setCurrentBowler(null);

        // Show innings summary
        setShowInningsSummary(true);
        toast.success('First innings complete! View the innings summary.');
      } else {
        // Match complete
        updatedMatch.status = 'completed';

        // Calculate match result
        const firstInnings = updatedMatch.innings[0];
        const secondInnings = updatedMatch.innings[1];
        const team1 = updatedMatch.team1;
        const team2 = updatedMatch.team2;

        const battingFirst = firstInnings.battingTeamId === team1.id ? team1 : team2;
        const battingSecond = secondInnings.battingTeamId === team1.id ? team1 : team2;

        let resultMessage = '';

        if (secondInnings.runs > firstInnings.runs) {
          // Chasing team won
          const wicketsRemaining = maxWickets - secondInnings.wickets;
          resultMessage = `${battingSecond.name} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
        } else if (firstInnings.runs > secondInnings.runs) {
          // Defending team won
          const runsMargin = firstInnings.runs - secondInnings.runs;
          resultMessage = `${battingFirst.name} won by ${runsMargin} run${runsMargin !== 1 ? 's' : ''}`;
        } else {
          // Tie
          resultMessage = 'Match Tied!';
        }

        toast.success(`Match Complete! ${resultMessage}`, { autoClose: 10000 });
      }
    }

    if (isWicket) {
      // Determine which batsman got out
      // Use outBatsmanId if provided, otherwise use striker
      const outBatsmanIndex = outBatsmanId
        ? updatedInnings.batsmen.findIndex(b => b.playerId === outBatsmanId)
        : updatedInnings.batsmen.findIndex(b => b.playerId === striker.playerId);

      const outBatsmanName = outBatsmanIndex >= 0
        ? updatedInnings.batsmen[outBatsmanIndex].playerName
        : striker.playerName;

      // Clear the batsman who got out from state
      if (outBatsmanId === striker?.playerId || !outBatsmanId) {
        setStriker(null);
      } else if (outBatsmanId === nonStriker?.playerId) {
        setNonStriker(null);
      }

      if (updatedInnings.wickets < 10) {
        toast.success(`Wicket! ${outBatsmanName} is out. Please select the next batsman.`, {
          autoClose: 4000,
        });
      } else {
        toast.success(`All Out! ${battingTeam.name} all out for ${updatedInnings.runs} runs.`, {
          autoClose: 5000,
        });
      }
    }

    // Show bowler change prompt after over completion
    if (overComplete && !isWicket && updatedInnings.wickets < 10 && totalBallsInInnings < maxBalls) {
      setShowBowlerChange(true);
      // Store previous bowler ID before clearing to prevent consecutive overs
      if (currentBowler) {
        setPreviousOverBowlerId(currentBowler.playerId);
      }
      // Clear current bowler to force selection of new bowler
      setCurrentBowler(null);
      toast.success('Over complete! Please select a new bowler.', {
        autoClose: 3000,
      });
    }

    // Reset undo count when a new ball is recorded
    setUndoCount(0);

    try {
      await updateMatch(updatedMatch);
    } catch (error) {
      console.error('Failed to update match:', error);
      toast.error('Failed to record ball. Please try again.');
    }
  };

  const selectPlayer = async (playerId: string, playerName: string, type: 'striker' | 'non-striker' | 'bowler') => {
    const updatedInnings = { ...currentMatch.innings[currentMatch.currentInnings - 1] };

    if (type === 'striker' || type === 'non-striker') {
      // Check if player already batting or retired hurt
      const existingBatsman = updatedInnings.batsmen.find(b => b.playerId === playerId);
      if (existingBatsman && !existingBatsman.isOut) {
        if (type === 'striker') setStriker(existingBatsman);
        else setNonStriker(existingBatsman);
      } else if (existingBatsman && existingBatsman.isRetiredHurt && existingBatsman.canReturn) {
        // Batsman returning from retired hurt
        const batsmanIndex = updatedInnings.batsmen.findIndex(b => b.playerId === playerId);
        if (batsmanIndex >= 0) {
          updatedInnings.batsmen[batsmanIndex].isRetiredHurt = false;
          updatedInnings.batsmen[batsmanIndex].isOut = false;
          updatedInnings.batsmen[batsmanIndex].isOnStrike = type === 'striker';

          if (type === 'striker') setStriker(updatedInnings.batsmen[batsmanIndex]);
          else setNonStriker(updatedInnings.batsmen[batsmanIndex]);

          const updatedMatch = { ...currentMatch };
          updatedMatch.innings[currentMatch.currentInnings - 1] = updatedInnings;
          await updateMatch(updatedMatch);
          toast.success(`${playerName} returns from retired hurt`);
        }
      } else if (!existingBatsman) {
        // Ensure all other batsmen are marked as not on strike
        updatedInnings.batsmen = updatedInnings.batsmen.map(b => ({
          ...b,
          isOnStrike: false
        }));

        const newBatsman: BatsmanStats = {
          playerId,
          playerName,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          strikeRate: 0,
          isOnStrike: type === 'striker',
        };
        updatedInnings.batsmen.push(newBatsman);

        // Update strike status - ensure only selected batsman is on strike
        if (type === 'striker') {
          setStriker(newBatsman);
          // Non-striker should also have isOnStrike = false
          if (nonStriker) {
            const nonStrikerIndex = updatedInnings.batsmen.findIndex(b => b.playerId === nonStriker.playerId);
            if (nonStrikerIndex >= 0) {
              updatedInnings.batsmen[nonStrikerIndex].isOnStrike = false;
            }
          }
        } else {
          setNonStriker(newBatsman);
          // Striker should retain isOnStrike = true
          if (striker) {
            const strikerIndex = updatedInnings.batsmen.findIndex(b => b.playerId === striker.playerId);
            if (strikerIndex >= 0) {
              updatedInnings.batsmen[strikerIndex].isOnStrike = true;
            }
          }
        }

        const updatedMatch = { ...currentMatch };
        updatedMatch.innings[currentMatch.currentInnings - 1] = updatedInnings;
        try {
          await updateMatch(updatedMatch);
        } catch (error) {
          console.error('Failed to add batsman:', error);
        }
      }
    } else if (type === 'bowler') {
      // Validate that bowler is not one of the current batsmen
      const isCurrentlyBatting = updatedInnings.batsmen.find(b => b.playerId === playerId && !b.isOut);
      if (isCurrentlyBatting) {
        toast.error(`${playerName} is currently batting and cannot bowl!`);
        setShowPlayerSelect(null);
        return;
      }

      // Check if this is after an over completion - prevent same bowler bowling consecutive overs
      // Use previousOverBowlerId which was stored before clearing currentBowler
      if (previousOverBowlerId && previousOverBowlerId === playerId) {
        toast.error(`${playerName} just bowled the previous over and cannot bowl consecutive overs!`);
        setShowPlayerSelect(null);
        return;
      }

      // Check if bowler has reached max overs
      const existingBowler = updatedInnings.bowlers.find(b => b.playerId === playerId);
      if (existingBowler) {
        const maxOversPerBowler = Math.ceil(currentMatch.overs / 5); // Always round up
        const bowlerOversCompleted = Math.floor(existingBowler.balls / 6);
        if (bowlerOversCompleted >= maxOversPerBowler) {
          toast.error(`${playerName} has already bowled the maximum ${maxOversPerBowler} overs!`);
          setShowPlayerSelect(null);
          return;
        }
        setCurrentBowler(existingBowler);
      } else {
        const newBowler: BowlerStats = {
          playerId,
          playerName,
          overs: 0,
          maidens: 0,
          runs: 0,
          wickets: 0,
          economy: 0,
          balls: 0,
        };
        updatedInnings.bowlers.push(newBowler);
        setCurrentBowler(newBowler);

        const updatedMatch = { ...currentMatch };
        updatedMatch.innings[currentMatch.currentInnings - 1] = updatedInnings;
        try {
          await updateMatch(updatedMatch);
        } catch (error) {
          console.error('Failed to add bowler:', error);
        }
      }

      // Clear previous over bowler ID once a new bowler is selected
      setPreviousOverBowlerId(null);
    }

    setShowPlayerSelect(null);
  };

  const handleRetiredHurt = async () => {
    if (!striker) {
      toast.error('No batsman on strike to retire hurt');
      return;
    }

    const updatedInnings = { ...currentInnings };
    const strikerIndex = updatedInnings.batsmen.findIndex(b => b.playerId === striker.playerId);

    if (strikerIndex >= 0) {
      // Mark as retired hurt
      updatedInnings.batsmen[strikerIndex].isRetiredHurt = true;
      updatedInnings.batsmen[strikerIndex].canReturn = true;
      updatedInnings.batsmen[strikerIndex].isOnStrike = false;
      updatedInnings.batsmen[strikerIndex].dismissalOver = currentInnings.overs;
      updatedInnings.batsmen[strikerIndex].dismissalBall = currentInnings.balls;
      updatedInnings.batsmen[strikerIndex].howOut = 'retired hurt';

      const updatedMatch = { ...currentMatch };
      updatedMatch.innings[currentMatch.currentInnings - 1] = updatedInnings;

      try {
        await updateMatch(updatedMatch);
        setStriker(null);
        toast.success(`${striker.playerName} retired hurt. Select next batsman.`);
      } catch (error) {
        console.error('Failed to retire hurt:', error);
        toast.error('Failed to process retired hurt.');
      }
    }
  };

  const handleExtraWithRuns = (extraType: 'wide' | 'no-ball' | 'bye' | 'leg-bye', runs: number) => {
    if (extraType === 'wide' || extraType === 'no-ball') {
      // For wide/no-ball, 'runs' is the extra runs beyond the penalty
      // Special case: No-ball + 6 = batsman OUT
      if (extraType === 'no-ball' && runs === 6) {
        recordBall(6, true, extraType, 0);
      } else {
        recordBall(0, false, extraType, runs);
      }
    } else {
      // For bye/leg-bye, 'runs' is the total runs
      recordBall(runs, false, extraType, 0);
    }
    setShowExtraInput(null);
  };

  const handleWideRunOut = (runs: number = 0) => {
    // Store the wide runs and open batsman selection for run out
    setPendingWideRuns(runs);
    setPendingExtraType('wide');
    setSelectedWicketType('run out');
    setShowWideRunOutInput(false);
    setShowBatsmanRunOutSelect(true);
  };

  const handleNoBallRunOut = (runs: number = 0) => {
    // Store the no-ball runs and open batsman selection for run out
    setPendingNoBallRuns(runs);
    setPendingExtraType('no-ball');
    setSelectedWicketType('run out');
    setShowNoBallRunOutInput(false);
    setShowBatsmanRunOutSelect(true);
  };

  const handleByeRunOut = (runs: number = 0) => {
    // Store the bye runs and open batsman selection for run out
    setPendingByeRuns(runs);
    setPendingExtraType('bye');
    setSelectedWicketType('run out');
    setShowByeRunOutInput(false);
    setShowBatsmanRunOutSelect(true);
  };

  const handleLegByeRunOut = (runs: number = 0) => {
    // Store the leg-bye runs and open batsman selection for run out
    setPendingLegByeRuns(runs);
    setPendingExtraType('leg-bye');
    setSelectedWicketType('run out');
    setShowLegByeRunOutInput(false);
    setShowBatsmanRunOutSelect(true);
  };

  const handleBatsmanRunOutSelection = (batsmanType: 'striker' | 'non-striker') => {
    // Store which batsman is out and proceed to fielder selection
    setSelectedRunOutBatsman(batsmanType);
    setShowBatsmanRunOutSelect(false);
    setShowFielderSelect(true);
  };

  const handleRunOutWithFielder = async (fielderName: string) => {
    // Determine which batsman got out
    const outBatsman = selectedRunOutBatsman === 'striker' ? striker : nonStriker;

    if (!outBatsman) {
      toast.error('Batsman not found');
      return;
    }

    // Record the ball based on extra type, passing the out batsman's ID
    if (pendingExtraType === 'wide') {
      await recordBall(0, true, 'wide', pendingWideRuns, 'run out', fielderName, false, outBatsman.playerId);
      setPendingWideRuns(0);
    } else if (pendingExtraType === 'no-ball') {
      await recordBall(0, true, 'no-ball', pendingNoBallRuns, 'run out', fielderName, false, outBatsman.playerId);
      setPendingNoBallRuns(0);
    } else if (pendingExtraType === 'bye') {
      await recordBall(pendingByeRuns, true, 'bye', 0, 'run out', fielderName, false, outBatsman.playerId);
      setPendingByeRuns(0);
    } else if (pendingExtraType === 'leg-bye') {
      await recordBall(pendingLegByeRuns, true, 'leg-bye', 0, 'run out', fielderName, false, outBatsman.playerId);
      setPendingLegByeRuns(0);
    }

    // Reset states
    setShowFielderSelect(false);
    setPendingExtraType(null);
    setSelectedRunOutBatsman(null);
  };

  const handleFixedOne = async () => {
    // 1 run, no strike change
    await recordBall(1, false, undefined, 0, undefined, undefined, true);
  };

  const handleByeOneNoStrike = async () => {
    // Bye 1 run, no strike change
    await recordBall(1, false, 'bye', 0, undefined, undefined, true);
  };

  const handleOverthrow = async (overthrowRuns: number) => {
    if (currentInnings.ballByBall.length === 0) {
      toast.error('No balls bowled yet');
      return;
    }

    const updatedInnings = { ...currentInnings };
    const lastBall = updatedInnings.ballByBall[updatedInnings.ballByBall.length - 1];

    // Add overthrow runs to innings total
    updatedInnings.runs += overthrowRuns;

    // Update the last ball to include overthrow info
    lastBall.isOverthrow = true;
    lastBall.overthrowRuns = overthrowRuns;
    lastBall.totalRuns = (lastBall.totalRuns || lastBall.runs) + overthrowRuns;

    // Rotate strike if overthrow runs are odd
    const shouldRotateStrike = overthrowRuns % 2 === 1;
    if (shouldRotateStrike && striker && nonStriker) {
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);

      // Update strike markers
      updatedInnings.batsmen = updatedInnings.batsmen.map(b => ({
        ...b,
        isOnStrike: b.playerId === nonStriker.playerId
      }));
    }

    // Update partnership
    if (updatedInnings.partnerships) {
      const activePartnership = updatedInnings.partnerships.find(p => p.isActive);
      if (activePartnership) {
        activePartnership.runs += overthrowRuns;
      }
    }

    const updatedMatch = { ...currentMatch };
    updatedMatch.innings[currentMatch.currentInnings - 1] = updatedInnings;

    try {
      await updateMatch(updatedMatch);
      setShowOverthrowInput(false);
      toast.success(`${overthrowRuns} overthrow run${overthrowRuns > 1 ? 's' : ''} added`);
    } catch (error) {
      console.error('Failed to add overthrow:', error);
      toast.error('Failed to record overthrow');
    }
  };

  const handleWicketTypeSelection = async (wicketType: string) => {
    // Check if wicket type needs fielder selection
    const needsFielder = ['caught', 'run out', 'stumped', 'caught & bowled'].includes(wicketType);

    if (needsFielder) {
      setSelectedWicketType(wicketType);
      setShowWicketTypeDialog(false);
      setShowFielderSelect(true);
    } else {
      setShowWicketTypeDialog(false);
      await recordBall(pendingWicketRuns, true, undefined, 0, wicketType);
    }
  };

  const openWicketDialog = (runs: number = 0) => {
    setPendingWicketRuns(runs);
    setShowWicketTypeDialog(true);
  };

  const handleUndoLastBall = async () => {
    if (currentInnings.ballByBall.length === 0) {
      toast.error('No balls to undo');
      return;
    }

    // Limit undo to last 3 consecutive balls only
    if (undoCount >= 3) {
      toast.error('Can only undo last 3 balls');
      return;
    }

    const updatedInnings = { ...currentInnings };
    const lastBall = updatedInnings.ballByBall[updatedInnings.ballByBall.length - 1];

    // Reverse runs
    updatedInnings.runs -= lastBall.totalRuns || lastBall.runs;

    // Reverse extras
    if (lastBall.extraType) {
      if (lastBall.extraType === 'wide') {
        // extraRuns already includes the penalty (1 + extra runs)
        updatedInnings.extras.wides -= lastBall.extraRuns;
      } else if (lastBall.extraType === 'no-ball') {
        // extraRuns already includes the penalty (1 + extra runs)
        updatedInnings.extras.noBalls -= lastBall.extraRuns;
      } else if (lastBall.extraType === 'bye') {
        updatedInnings.extras.byes -= lastBall.runs;
      } else if (lastBall.extraType === 'leg-bye') {
        updatedInnings.extras.legByes -= lastBall.runs;
      }
    }

    // Reverse batsman stats
    const batsmanIndex = updatedInnings.batsmen.findIndex(b => b.playerName === lastBall.batsman);
    if (batsmanIndex >= 0) {
      const batsman = updatedInnings.batsmen[batsmanIndex];

      // Only reverse if not bye/leg-bye
      const extraType = lastBall.extraType;
      if (!extraType || (extraType !== 'bye' && extraType !== 'leg-bye')) {
        const batsmanRuns = (lastBall.extraType === 'wide' || lastBall.extraType === 'no-ball')
          ? lastBall.runs + lastBall.extraRuns
          : lastBall.runs;
        batsman.runs -= batsmanRuns;

        // Only reverse ball count if it was a valid delivery
        const validBall = !lastBall.isExtra || lastBall.extraType === 'bye' || lastBall.extraType === 'leg-bye';
        if (validBall && batsman.balls > 0) batsman.balls -= 1;

        if (batsmanRuns === 4 && batsman.fours > 0) batsman.fours -= 1;

        // Reverse wicket
        if (lastBall.isWicket) {
          batsman.isOut = false;
          updatedInnings.wickets -= 1;

          // Remove fall of wicket
          if (updatedInnings.fallOfWickets && updatedInnings.fallOfWickets.length > 0) {
            updatedInnings.fallOfWickets.pop();
          }

          // Restore the batsman who got out back as striker
          batsman.isOnStrike = true;
          setStriker(batsman);

          // Find and set the non-striker from the ball record
          const nonStrikerBatsman = updatedInnings.batsmen.find(b => b.playerName === lastBall.nonStriker);
          if (nonStrikerBatsman) {
            nonStrikerBatsman.isOnStrike = false;
            setNonStriker(nonStrikerBatsman);
          }
        }

        batsman.strikeRate = calculateStrikeRate(batsman.runs, batsman.balls);
      }
    }

    // Reverse bowler stats
    const bowlerIndex = updatedInnings.bowlers.findIndex(b => b.playerName === lastBall.bowler);
    if (bowlerIndex >= 0) {
      const bowler = updatedInnings.bowlers[bowlerIndex];

      const validBall = !lastBall.isExtra || lastBall.extraType === 'bye' || lastBall.extraType === 'leg-bye';
      if (validBall && bowler.balls > 0) {
        bowler.balls -= 1;
        bowler.overs = parseFloat(formatOvers(bowler.balls));
      }

      bowler.runs -= (lastBall.totalRuns || lastBall.runs);

      if (lastBall.isWicket && bowler.wickets > 0) {
        bowler.wickets -= 1;
      }

      if (bowler.balls > 0) {
        const economy = (bowler.runs / (bowler.balls / 6));
        bowler.economy = parseFloat(economy.toFixed(2));
      } else {
        bowler.economy = 0;
      }
    }

    // Reverse ball count
    const validBall = !lastBall.isExtra || lastBall.extraType === 'bye' || lastBall.extraType === 'leg-bye';
    if (validBall) {
      if (updatedInnings.balls === 0) {
        if (updatedInnings.overs > 0) {
          updatedInnings.overs -= 1;
          updatedInnings.balls = 5;
        }
      } else {
        updatedInnings.balls -= 1;
      }
    }

    // Reverse partnership
    if (updatedInnings.partnerships) {
      if (lastBall.isWicket) {
        // If it was a wicket, find the partnership that was ended and reactivate it
        const lastPartnership = updatedInnings.partnerships[updatedInnings.partnerships.length - 1];
        if (lastPartnership && !lastPartnership.isActive) {
          lastPartnership.isActive = true;
          const runsToDeduct = lastBall.totalRuns || lastBall.runs;
          if (lastPartnership.runs >= runsToDeduct) {
            lastPartnership.runs -= runsToDeduct;
          }
          const validBall = !lastBall.isExtra || lastBall.extraType === 'bye' || lastBall.extraType === 'leg-bye';
          if (validBall && lastPartnership.balls > 0) {
            lastPartnership.balls -= 1;
          }
        }
      } else {
        // For non-wicket balls, reverse from active partnership
        const activePartnership = updatedInnings.partnerships.find(p => p.isActive);
        if (activePartnership) {
          const runsToDeduct = lastBall.totalRuns || lastBall.runs;
          if (activePartnership.runs >= runsToDeduct) {
            activePartnership.runs -= runsToDeduct;
          }
          const validBall = !lastBall.isExtra || lastBall.extraType === 'bye' || lastBall.extraType === 'leg-bye';
          if (validBall && activePartnership.balls > 0) {
            activePartnership.balls -= 1;
          }
        }
      }
    }

    // Reverse strike rotation for non-wicket balls
    if (!lastBall.isWicket) {
      // Restore striker and non-striker from ball record
      const strikerBatsman = updatedInnings.batsmen.find(b => b.playerName === lastBall.batsman);
      const nonStrikerBatsman = updatedInnings.batsmen.find(b => b.playerName === lastBall.nonStriker);

      if (strikerBatsman && nonStrikerBatsman) {
        strikerBatsman.isOnStrike = true;
        nonStrikerBatsman.isOnStrike = false;
        setStriker(strikerBatsman);
        setNonStriker(nonStrikerBatsman);
      }
    }

    // Remove the last ball
    updatedInnings.ballByBall.pop();

    // Clear free hit if this was the ball that triggered it
    if (lastBall.extraType === 'no-ball' && isFreeHit) {
      setIsFreeHit(false);
    }

    const updatedMatch = { ...currentMatch };
    updatedMatch.innings[currentMatch.currentInnings - 1] = updatedInnings;

    try {
      await updateMatch(updatedMatch);
      setUndoCount(undoCount + 1);
      toast.success('Last ball undone');
    } catch (error) {
      console.error('Failed to undo last ball:', error);
      toast.error('Failed to undo last ball');
    }
  };

  const target = currentMatch.currentInnings === 2 ? currentMatch.innings[0].runs + 1 : undefined;

  const getEnabledAds = () => {
    if (!currentMatch.tournamentId) return [];
    return ads.filter(ad => ad.tournamentId === currentMatch.tournamentId && ad.enabled);
  };

  const handleShowAd = async () => {
    const enabledAds = getEnabledAds();
    if (enabledAds.length === 0) {
      toast.error('No ads available');
      return;
    }

    const adToShow = enabledAds[0];

    // Broadcast via HTTP API to all network instances viewing scoreboard
    try {
      const response = await fetch('http://localhost:3000/api/ad/show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adToShow)
      });

      if (response.ok) {
        toast.success('Ad broadcasted to all scoreboards!');
        setIsAdBroadcasting(true);

        // Auto-stop after ad duration
        setTimeout(() => {
          handleStopAd();
        }, (adToShow.duration || 30) * 1000);
      } else {
        throw new Error('Server not responding');
      }
    } catch (error) {
      console.error('Failed to broadcast ad:', error);
      toast.error('Failed to broadcast ad. Make sure the server is running.');
    }
  };

  const handleStopAd = async () => {
    try {
      await fetch('http://localhost:3000/api/ad/close', {
        method: 'POST'
      });
      setIsAdBroadcasting(false);
      toast.success('Ad stopped on all scoreboards');
    } catch (error) {
      console.error('Failed to stop ad:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            {getEnabledAds().length > 0 && (
              <>
                <button
                  onClick={handleShowAd}
                  disabled={isAdBroadcasting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isAdBroadcasting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white`}
                >
                  <Film className="w-5 h-5" />
                  <span className="hidden md:inline">{isAdBroadcasting ? 'Ad Playing...' : 'Show Ad'}</span>
                </button>
                {isAdBroadcasting && (
                  <button
                    onClick={handleStopAd}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <span className="hidden md:inline">Stop Ad</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => {
                // For HashRouter, need to use the hash in the URL
                const baseUrl = window.location.href.split('#')[0];
                window.open(`${baseUrl}#/scoreboard`, '_blank');
              }}
              className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
            >
              <Eye className="w-5 h-5" />
              <span className="hidden md:inline">View Scoreboard</span>
            </button>
          </div>
        </div>

        {/* Score Display */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4">
          <div className="text-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              {battingTeam.name} vs {bowlingTeam.name}
            </h2>
            <p className="text-gray-600">
              {currentMatch.currentInnings === 1 ? '1st Innings' : '2nd Innings'}
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl md:text-6xl font-bold text-gray-800 mb-2">
              {currentInnings.runs}/{currentInnings.wickets}
            </div>
            <div className="text-xl md:text-2xl text-gray-600">
              Overs: {formatOvers(getTotalBalls(currentInnings.overs, currentInnings.balls))}
            </div>
            {target && (
              <div className="mt-2 text-lg text-blue-600 font-semibold">
                Need {target - currentInnings.runs} runs to win
              </div>
            )}
            {isFreeHit && (
              <div className="mt-3 inline-block bg-green-500 text-white px-6 py-2 rounded-full font-bold text-lg animate-pulse shadow-lg">
                🎯 FREE HIT
              </div>
            )}
          </div>
        </div>

        {/* Match Result - shown when match is completed */}
        {currentMatch.status === 'completed' && currentMatch.innings.length === 2 && (
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl shadow-lg p-6 md:p-8 mb-4">
            <div className="text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Match Complete!</h2>
              <div className="text-2xl md:text-3xl font-semibold">
                {(() => {
                  const firstInnings = currentMatch.innings[0];
                  const secondInnings = currentMatch.innings[1];
                  const battingFirst = firstInnings.battingTeamId === currentMatch.team1.id ? currentMatch.team1 : currentMatch.team2;
                  const battingSecond = secondInnings.battingTeamId === currentMatch.team1.id ? currentMatch.team1 : currentMatch.team2;

                  if (secondInnings.runs > firstInnings.runs) {
                    const wicketsRemaining = maxWickets - secondInnings.wickets;
                    return `${battingSecond.name} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
                  } else if (firstInnings.runs > secondInnings.runs) {
                    const runsMargin = firstInnings.runs - secondInnings.runs;
                    return `${battingFirst.name} won by ${runsMargin} run${runsMargin !== 1 ? 's' : ''}`;
                  } else {
                    return 'Match Tied!';
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Innings Summaries - shown when match is completed */}
        {currentMatch.status === 'completed' && currentMatch.innings.length === 2 && (
          <div className="space-y-4 mb-4">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-blue-600 text-white p-4">
                <h3 className="text-xl font-bold">1st Innings</h3>
              </div>
              <InningsSummary
                innings={currentMatch.innings[0]}
                battingTeam={currentMatch.innings[0].battingTeamId === currentMatch.team1.id ? currentMatch.team1 : currentMatch.team2}
                bowlingTeam={currentMatch.innings[0].bowlingTeamId === currentMatch.team1.id ? currentMatch.team1 : currentMatch.team2}
                match={currentMatch}
                inningsNumber={1}
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-green-600 text-white p-4">
                <h3 className="text-xl font-bold">2nd Innings</h3>
              </div>
              <InningsSummary
                innings={currentMatch.innings[1]}
                battingTeam={currentMatch.innings[1].battingTeamId === currentMatch.team1.id ? currentMatch.team1 : currentMatch.team2}
                bowlingTeam={currentMatch.innings[1].bowlingTeamId === currentMatch.team1.id ? currentMatch.team1 : currentMatch.team2}
                match={currentMatch}
                inningsNumber={2}
              />
            </div>
          </div>
        )}

        {/* Batsmen & Bowler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-xl shadow p-4">
            <button
              onClick={() => {
                if (currentMatch.status === 'completed') {
                  toast.error('Match is already completed');
                  return;
                }
                // Only allow batsman change if striker is not set or is out
                if (!striker || striker.isOut) {
                  setShowPlayerSelect('striker');
                } else {
                  toast.error('Cannot change batsmen during play. Batsmen can only be changed after a wicket.');
                }
              }}
              disabled={currentMatch.status === 'completed'}
              className={`w-full text-left ${currentMatch.status === 'completed' ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <p className="text-sm text-gray-600 mb-1">Striker *</p>
              <p className="font-bold text-lg">{striker?.playerName || 'Select Batsman'}</p>
              {striker && (
                <p className="text-sm text-gray-600">
                  {striker.runs}({striker.balls}) SR: {striker.strikeRate}
                </p>
              )}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <button
              onClick={() => {
                if (currentMatch.status === 'completed') {
                  toast.error('Match is already completed');
                  return;
                }
                // Only allow batsman change if non-striker is not set or is out
                if (!nonStriker || nonStriker.isOut) {
                  setShowPlayerSelect('non-striker');
                } else {
                  toast.error('Cannot change batsmen during play. Batsmen can only be changed after a wicket.');
                }
              }}
              disabled={currentMatch.status === 'completed'}
              className={`w-full text-left ${currentMatch.status === 'completed' ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <p className="text-sm text-gray-600 mb-1">Non-Striker</p>
              <p className="font-bold text-lg">{nonStriker?.playerName || 'Select Batsman'}</p>
              {nonStriker && (
                <p className="text-sm text-gray-600">
                  {nonStriker.runs}({nonStriker.balls}) SR: {nonStriker.strikeRate}
                </p>
              )}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <button
              onClick={() => {
                if (currentMatch.status === 'completed') {
                  toast.error('Match is already completed');
                  return;
                }
                setShowPlayerSelect('bowler');
              }}
              disabled={currentMatch.status === 'completed'}
              className={`w-full text-left ${currentMatch.status === 'completed' ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <p className="text-sm text-gray-600 mb-1">Bowler *</p>
              <p className="font-bold text-lg">{currentBowler?.playerName || 'Select Bowler'}</p>
              {currentBowler && (
                <p className="text-sm text-gray-600">
                  {formatOvers(currentBowler.balls)}-{currentBowler.maidens}-{currentBowler.runs}-{currentBowler.wickets}
                </p>
              )}
            </button>
          </div>
        </div>

        {/* New Checkbox-Based Scoring System */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4">
          {/* Extras Checkboxes */}
          <div className="mb-4">
            <h3 className="font-bold text-lg mb-3">Extras</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <label className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer border-2 transition ${
                isNoBall ? 'bg-orange-100 border-orange-500' : 'border-gray-300 hover:border-orange-400'
              } ${currentMatch.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={isNoBall}
                  onChange={handleNoBallToggle}
                  disabled={currentMatch.status === 'completed'}
                  className="w-5 h-5 accent-orange-500"
                />
                <span className="font-semibold">No Ball</span>
              </label>

              <label className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer border-2 transition ${
                isWide ? 'bg-yellow-100 border-yellow-500' : 'border-gray-300 hover:border-yellow-400'
              } ${currentMatch.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={isWide}
                  onChange={handleWideToggle}
                  disabled={currentMatch.status === 'completed'}
                  className="w-5 h-5 accent-yellow-500"
                />
                <span className="font-semibold">Wide</span>
              </label>

              <label className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer border-2 transition ${
                isBye ? 'bg-indigo-100 border-indigo-500' : 'border-gray-300 hover:border-indigo-400'
              } ${currentMatch.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={isBye}
                  onChange={handleByeToggle}
                  disabled={currentMatch.status === 'completed'}
                  className="w-5 h-5 accent-indigo-500"
                />
                <span className="font-semibold">Bye</span>
              </label>

              <label className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer border-2 transition ${
                isLegBye ? 'bg-pink-100 border-pink-500' : 'border-gray-300 hover:border-pink-400'
              } ${currentMatch.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={isLegBye}
                  onChange={handleLegByeToggle}
                  disabled={currentMatch.status === 'completed'}
                  className="w-5 h-5 accent-pink-500"
                />
                <span className="font-semibold">Leg Bye</span>
              </label>

              <label className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer border-2 transition ${
                isOverthrow ? 'bg-blue-100 border-blue-500' : 'border-gray-300 hover:border-blue-400'
              } ${currentMatch.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={isOverthrow}
                  onChange={() => setIsOverthrow(!isOverthrow)}
                  disabled={currentMatch.status === 'completed'}
                  className="w-5 h-5 accent-blue-500"
                />
                <span className="font-semibold">Overthrow</span>
              </label>
            </div>

            {isOverthrow && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <label className="block mb-2 font-semibold text-sm">Overthrow Runs:</label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={overthrowRuns}
                  onChange={(e) => setOverthrowRuns(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Runs Buttons */}
          <div className="mb-4">
            <h3 className="font-bold text-lg mb-3">Select Runs</h3>
            <div className="grid grid-cols-4 gap-2 md:gap-3">
              {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                <button
                  key={run}
                  onClick={() => handleRunsSelection(run)}
                  disabled={currentMatch.status === 'completed'}
                  className={`py-4 md:py-6 rounded-lg font-bold text-xl md:text-2xl transition-all ${
                    currentMatch.status === 'completed'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : selectedRuns === run
                        ? 'ring-4 ring-offset-2 ring-green-500 shadow-lg transform scale-105'
                        : ''
                  } ${
                    run === 0 ? 'bg-gray-200 hover:bg-gray-300' :
                    run === 4 ? 'bg-blue-500 text-white hover:bg-blue-600' :
                    run === 6 ? 'bg-purple-500 text-white hover:bg-purple-600' :
                    'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {run}
                </button>
              ))}
              <button
                onClick={() => openWicketDialog(0)}
                disabled={currentMatch.status === 'completed'}
                className={`py-4 md:py-6 rounded-lg font-bold text-xl md:text-2xl transition-colors ${
                  currentMatch.status === 'completed'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                OUT
              </button>
            </div>
          </div>

          {/* Fixed Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleFixedOne()}
              disabled={currentMatch.status === 'completed'}
              className={`py-3 rounded-lg font-semibold ${
                currentMatch.status === 'completed'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-500 text-white hover:bg-teal-600'
              }`}
            >
              1 (Fixed)
            </button>
            <button
              onClick={() => handleByeOneNoStrike()}
              disabled={currentMatch.status === 'completed'}
              className={`py-3 rounded-lg font-semibold ${
                currentMatch.status === 'completed'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-500 text-white hover:bg-cyan-600'
              }`}
            >
              Bye 1 (Fixed)
            </button>
          </div>

          {/* Record Ball Button */}
          <button
            onClick={() => handleRecordBall()}
            disabled={currentMatch.status === 'completed' || selectedRuns === null}
            className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${
              currentMatch.status === 'completed' || selectedRuns === null
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 shadow-lg transform hover:scale-105'
            }`}
          >
            {selectedRuns === null ? 'Select Runs First' : `Record Ball (${selectedRuns} runs)`}
          </button>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleRetiredHurt()}
              className="flex-1 py-2 px-3 rounded-lg font-semibold bg-gray-600 text-white hover:bg-gray-700 text-sm"
              disabled={!striker || currentMatch.status === 'completed'}
            >
              Retired Hurt
            </button>
            <button
              onClick={() => handleUndoLastBall()}
              className="flex-1 py-2 px-3 rounded-lg font-semibold bg-orange-600 text-white hover:bg-orange-700 text-sm"
              disabled={currentInnings.ballByBall.length === 0 || currentMatch.status === 'completed'}
            >
              Undo Ball
            </button>
          </div>
        </div>

        {/* Player Selection Modal */}
        {showPlayerSelect && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 capitalize">
                Select {showPlayerSelect === 'bowler' ? 'Bowler' : 'Batsman'}
              </h2>
              <div className="space-y-2">
                {(showPlayerSelect === 'bowler' ? bowlingTeam : battingTeam).players
                  .filter((player) => {
                    // Filter by playing XI first - STRICT: Only show playing XI players
                    const playingXI = showPlayerSelect === 'bowler'
                      ? (currentInnings.bowlingTeamId === currentMatch.team1.id ? currentMatch.team1PlayingXI : currentMatch.team2PlayingXI)
                      : (currentInnings.battingTeamId === currentMatch.team1.id ? currentMatch.team1PlayingXI : currentMatch.team2PlayingXI);

                    // STRICT CHECK: Only allow players in playing XI
                    // If playingXI is not defined or empty, show all players (backward compatibility)
                    // But if it IS defined, strictly enforce it
                    if (playingXI && playingXI.length > 0) {
                      if (!playingXI.includes(player.id)) {
                        return false; // Player NOT in playing XI - exclude them
                      }
                    }

                    // For batsmen, exclude players who are already out (but allow retired hurt)
                    if (showPlayerSelect !== 'bowler') {
                      const batsmanRecord = currentInnings.batsmen.find(b => b.playerId === player.id);
                      return !batsmanRecord || !batsmanRecord.isOut || (batsmanRecord.isRetiredHurt && batsmanRecord.canReturn);
                    }
                    return true;
                  })
                  .map((player) => {
                    // Check if batsman is already playing or retired hurt
                    const batsmanRecord = currentInnings.batsmen.find(b => b.playerId === player.id);
                    const isCurrentlyBatting = batsmanRecord && !batsmanRecord.isOut && !batsmanRecord.isRetiredHurt;
                    const isRetiredHurt = batsmanRecord?.isRetiredHurt && batsmanRecord?.canReturn;

                    return (
                      <button
                        key={player.id}
                        onClick={() => selectPlayer(player.id, player.name, showPlayerSelect)}
                        className={`w-full p-3 text-left rounded-lg transition-colors ${
                          isCurrentlyBatting
                            ? 'bg-green-50 border-2 border-green-500'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        disabled={isCurrentlyBatting && showPlayerSelect !== 'bowler'}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{player.name}</p>
                            <p className="text-sm text-gray-600 capitalize">{player.role}</p>
                            {batsmanRecord && !isCurrentlyBatting && (
                              <p className="text-xs text-gray-500">
                                {batsmanRecord.runs}({batsmanRecord.balls})
                              </p>
                            )}
                          </div>
                          {isCurrentlyBatting && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">Batting</span>
                          )}
                          {isRetiredHurt && (
                            <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">Retired Hurt</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
              <button
                onClick={() => setShowPlayerSelect(null)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Extra Runs Input Modal */}
        {showExtraInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 capitalize">
                {showExtraInput === 'wide' && 'Wide + Runs'}
                {showExtraInput === 'no-ball' && 'No Ball + Runs'}
                {showExtraInput === 'bye' && 'Bye Runs'}
                {showExtraInput === 'leg-bye' && 'Leg Bye Runs'}
              </h2>
              <p className="text-gray-600 mb-4">
                {showExtraInput === 'wide' && 'Select additional runs scored on this wide ball (max 5)'}
                {showExtraInput === 'no-ball' && 'Select runs scored on this no-ball (6 = OUT)'}
                {showExtraInput === 'bye' && 'Select bye runs scored (max 5)'}
                {showExtraInput === 'leg-bye' && 'Select leg bye runs scored (max 5)'}
              </p>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {(showExtraInput === 'wide' || showExtraInput === 'bye' || showExtraInput === 'leg-bye' ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6]).map((run) => (
                  <button
                    key={run}
                    onClick={() => {
                      if (showExtraInput === 'wide') {
                        setPendingWideRuns(run);
                      }
                      handleExtraWithRuns(showExtraInput, run);
                    }}
                    className={`py-4 rounded-lg font-bold text-xl transition-colors ${
                      run === 0 ? 'bg-gray-200 hover:bg-gray-300' :
                      run === 4 ? 'bg-blue-500 text-white hover:bg-blue-600' :
                      run === 6 ? 'bg-purple-500 text-white hover:bg-purple-600' :
                      'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {run}
                  </button>
                ))}
              </div>
              {showExtraInput === 'wide' && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setShowExtraInput(null);
                      setShowWideRunOutInput(true);
                      setSelectedWicketType('run out');
                    }}
                    className="w-full py-3 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700"
                  >
                    Wide + Run Out
                  </button>
                </div>
              )}
              {showExtraInput === 'no-ball' && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setShowExtraInput(null);
                      setShowNoBallRunOutInput(true);
                      setSelectedWicketType('run out');
                    }}
                    className="w-full py-3 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700"
                  >
                    No Ball + Run Out
                  </button>
                </div>
              )}
              {showExtraInput === 'bye' && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setShowExtraInput(null);
                      setShowByeRunOutInput(true);
                      setSelectedWicketType('run out');
                    }}
                    className="w-full py-3 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700"
                  >
                    Bye + Run Out
                  </button>
                </div>
              )}
              {showExtraInput === 'leg-bye' && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setShowExtraInput(null);
                      setShowLegByeRunOutInput(true);
                      setSelectedWicketType('run out');
                    }}
                    className="w-full py-3 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700"
                  >
                    Leg Bye + Run Out
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowExtraInput(null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Overthrow Input Modal */}
        {showOverthrowInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Add Overthrow</h2>
              <p className="text-gray-600 mb-4">
                Select overthrow runs to add to the last ball
              </p>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[1, 2, 3, 4].map((run) => (
                  <button
                    key={run}
                    onClick={() => handleOverthrow(run)}
                    className="py-4 rounded-lg font-bold text-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    {run}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowOverthrowInput(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Wide + Run Out Runs Input */}
        {showWideRunOutInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Wide + Run Out</h2>
              <p className="text-gray-600 mb-4">
                How many runs were scored before the run out?
              </p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[0, 1, 2, 3, 4, 5].map((run) => (
                  <button
                    key={run}
                    onClick={() => handleWideRunOut(run)}
                    className="py-4 rounded-lg font-bold text-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    {run}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowWideRunOutInput(false);
                  setShowExtraInput('wide'); // Go back to wide input
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* No Ball + Run Out Runs Input */}
        {showNoBallRunOutInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">No Ball + Run Out</h2>
              <p className="text-gray-600 mb-4">
                How many runs were scored before the run out?
              </p>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                  <button
                    key={run}
                    onClick={() => handleNoBallRunOut(run)}
                    className="py-4 rounded-lg font-bold text-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    {run}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowNoBallRunOutInput(false);
                  setShowExtraInput('no-ball'); // Go back to no-ball input
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bye + Run Out Runs Input */}
        {showByeRunOutInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Bye + Run Out</h2>
              <p className="text-gray-600 mb-4">
                How many runs were scored before the run out?
              </p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[0, 1, 2, 3, 4, 5].map((run) => (
                  <button
                    key={run}
                    onClick={() => handleByeRunOut(run)}
                    className="py-4 rounded-lg font-bold text-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    {run}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowByeRunOutInput(false);
                  setShowExtraInput('bye'); // Go back to bye input
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Leg Bye + Run Out Runs Input */}
        {showLegByeRunOutInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Leg Bye + Run Out</h2>
              <p className="text-gray-600 mb-4">
                How many runs were scored before the run out?
              </p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[0, 1, 2, 3, 4, 5].map((run) => (
                  <button
                    key={run}
                    onClick={() => handleLegByeRunOut(run)}
                    className="py-4 rounded-lg font-bold text-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    {run}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowLegByeRunOutInput(false);
                  setShowExtraInput('leg-bye'); // Go back to leg-bye input
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Batsman Run Out Selection Modal */}
        {showBatsmanRunOutSelect && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Run Out</h2>
              <p className="text-gray-600 mb-4">
                Which batsman got run out?
              </p>
              <div className="space-y-3 mb-4">
                <button
                  onClick={() => handleBatsmanRunOutSelection('striker')}
                  className="w-full p-4 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <div className="text-left">
                    <div className="text-lg font-bold">Striker: {striker?.playerName || 'Not selected'}</div>
                    {striker && (
                      <div className="text-sm opacity-90">
                        {striker.runs}({striker.balls}) - SR: {striker.strikeRate}
                      </div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleBatsmanRunOutSelection('non-striker')}
                  className="w-full p-4 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  <div className="text-left">
                    <div className="text-lg font-bold">Non-Striker: {nonStriker?.playerName || 'Not selected'}</div>
                    {nonStriker && (
                      <div className="text-sm opacity-90">
                        {nonStriker.runs}({nonStriker.balls}) - SR: {nonStriker.strikeRate}
                      </div>
                    )}
                  </div>
                </button>
              </div>
              <button
                onClick={() => {
                  setShowBatsmanRunOutSelect(false);
                  // Go back to the appropriate runs input dialog
                  if (pendingExtraType === 'wide') setShowWideRunOutInput(true);
                  else if (pendingExtraType === 'no-ball') setShowNoBallRunOutInput(true);
                  else if (pendingExtraType === 'bye') setShowByeRunOutInput(true);
                  else if (pendingExtraType === 'leg-bye') setShowLegByeRunOutInput(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Wicket Type Selector Modal */}
        {showWicketTypeDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Select Wicket Type</h2>
              <p className="text-gray-600 mb-4">
                Choose how the batsman was dismissed
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { value: 'bowled', label: 'Bowled', emoji: '🎯' },
                  { value: 'caught', label: 'Caught', emoji: '🤲' },
                  { value: 'lbw', label: 'LBW', emoji: '🦵' },
                  { value: 'run out', label: 'Run Out', emoji: '🏃' },
                  { value: 'stumped', label: 'Stumped', emoji: '🧤' },
                  { value: 'hit wicket', label: 'Hit Wicket', emoji: '💥' },
                  { value: 'caught & bowled', label: 'C & B', emoji: '🎯🤲' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleWicketTypeSelection(type.value)}
                    className="py-3 px-4 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{type.emoji}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>

              {/* 6 OUT Button - Special Local Rule */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2 text-center">
                  Local Rule: Hit for 6 = OUT
                </div>
                <button
                  onClick={() => {
                    setShowWicketTypeDialog(false);
                    recordBall(6, true);
                  }}
                  className="w-full py-4 rounded-lg font-bold text-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                  title="Hit for 6 = OUT (local rule)"
                >
                  6 OUT
                </button>
              </div>

              <button
                onClick={() => setShowWicketTypeDialog(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Fielder Selection Modal */}
        {showFielderSelect && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Select Fielder</h2>
              <p className="text-gray-600 mb-4">
                Who was involved in the {selectedWicketType}?
              </p>
              <div className="space-y-2 mb-4">
                {bowlingTeam.players.map(player => (
                  <button
                    key={player.id}
                    onClick={async () => {
                      // Check if this is an extra+runout case
                      if (selectedWicketType === 'run out' && pendingExtraType) {
                        handleRunOutWithFielder(player.name);
                      } else {
                        setShowFielderSelect(false);
                        await recordBall(pendingWicketRuns, true, undefined, 0, selectedWicketType, player.name);
                      }
                    }}
                    className="w-full p-3 bg-gray-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{player.name}</div>
                        <div className="text-sm text-gray-600">{player.role}</div>
                      </div>
                      {player.jerseyNumber && (
                        <div className="text-lg font-bold text-gray-400">#{player.jerseyNumber}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowFielderSelect(false);
                  setShowWicketTypeDialog(true); // Go back to wicket type selection
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Bowler Change Modal */}
        {showBowlerChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Over Complete!</h2>
              <p className="text-gray-600 mb-6">
                Please select a new bowler to continue.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBowlerChange(false);
                    setShowPlayerSelect('bowler');
                  }}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  Change Bowler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exit Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          onConfirm={() => navigate('/')}
          title="Exit Scoring"
          message="Are you sure you want to exit? Your progress will be saved."
          confirmText="Exit"
          cancelText="Stay"
          variant="warning"
        />

        {/* Innings Summary */}
        {showInningsSummary && currentMatch.innings.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <InningsSummary
                innings={currentMatch.innings[0]}
                battingTeam={currentMatch.team1.id === currentMatch.innings[0].battingTeamId ? currentMatch.team1 : currentMatch.team2}
                bowlingTeam={currentMatch.team1.id === currentMatch.innings[0].bowlingTeamId ? currentMatch.team1 : currentMatch.team2}
                match={currentMatch}
                inningsNumber={1}
              />
              <div className="p-6 bg-gray-50 border-t">
                <button
                  onClick={() => setShowInningsSummary(false)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Start Second Innings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scoring;
