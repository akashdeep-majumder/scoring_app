import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Tournament, Match, Ad } from '../types';
import api from '../utils/api';

interface AppContextType {
  tournaments: Tournament[];
  currentMatch: Match | null;
  ads: Ad[];
  loading: boolean;
  addTournament: (tournament: Tournament) => Promise<void>;
  updateTournament: (tournament: Tournament) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  setCurrentMatch: (match: Match | null) => Promise<void>;
  updateMatch: (match: Match) => Promise<void>;
  addAd: (ad: Ad) => Promise<void>;
  updateAd: (ad: Ad) => Promise<void>;
  deleteAd: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
} 

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentMatch, setCurrentMatchState] = useState<Match | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, []);

  // Listen for match updates from Electron (for scoreboard sync)
  useEffect(() => {
    if (window.electronAPI?.onMatchUpdated) {
      window.electronAPI.onMatchUpdated((updatedMatch: Match) => {
        setCurrentMatchState(updatedMatch);
      });

      return () => {
        window.electronAPI?.removeMatchUpdatedListener();
      };
    }
  }, []);

  // Listen for data updates from server API (for browser sync)
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('Data updated - refreshing...');
      loadData();
    };

    window.addEventListener('data-updated', handleDataUpdate);

    return () => {
      window.removeEventListener('data-updated', handleDataUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load tournaments
      const tournamentsResult = await api.getAllTournaments();
      if (tournamentsResult.success) {
        let tournaments = tournamentsResult.data || [];

        // Migration: Update old tournaments with default playersPerTeam if not set
        let needsUpdate = false;
        tournaments = tournaments.map((t: Tournament) => {
          if (!t.playersPerTeam || t.playersPerTeam === 11) {
            needsUpdate = true;
            return { ...t, playersPerTeam: 6 }; // Default to 6v6 format
          }
          return t;
        });

        // Save migrated tournaments back
        if (needsUpdate) {
          for (const tournament of tournaments) {
            await api.updateTournament(tournament.id, tournament);
          }
        }

        setTournaments(tournaments);
      }

      // Load current match
      const matchResult = await api.getCurrentMatch();
      if (matchResult.success) {
        setCurrentMatchState(matchResult.data);
      }

      // Load ads
      const adsResult = await api.getAllAds();
      if (adsResult.success) {
        setAds(adsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  const addTournament = async (tournament: Tournament) => {
    try {
      const result = await api.addTournament(tournament);
      if (result.success) {
        setTournaments([...tournaments, result.data]);
      } else {
        const errorMsg = (result as any).error || 'Failed to add tournament';
        console.error('Error adding tournament:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error adding tournament:', error);
      throw error;
    }
  };

  const updateTournament = async (tournament: Tournament) => {
    try {
      const result = await api.updateTournament(tournament.id, tournament);
      if (result.success) {
        // Reload all tournaments to get updated structure
        const tournamentsResult = await api.getAllTournaments();
        if (tournamentsResult.success) {
          setTournaments(tournamentsResult.data || []);
        }
      } else {
        const errorMsg = (result as any).error || 'Failed to update tournament';
        console.error('Error updating tournament:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  };

  const deleteTournament = async (id: string) => {
    try {
      const result = await api.deleteTournament(id);
      if (result.success) {
        setTournaments(tournaments.filter(t => t.id !== id));
      } else {
        const errorMsg = (result as any).error || 'Failed to delete tournament';
        console.error('Error deleting tournament:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  };

  const setCurrentMatch = async (match: Match | null) => {
    try {
      if (match) {
        const result = await api.addMatch(match);
        if (result.success) {
          setCurrentMatchState(result.data);
        } else {
          const errorMsg = (result as any).error || 'Failed to set current match';
          console.error('Error setting current match:', errorMsg);
          throw new Error(errorMsg);
        }
      } else {
        setCurrentMatchState(null);
      }
    } catch (error) {
      console.error('Error setting current match:', error);
      throw error;
    }
  };

  const updateMatch = async (match: Match) => {
    try {
      const result = await api.updateMatch(match);
      if (result.success) {
        setCurrentMatchState(result.data);

        // Update tournaments list
        const tournamentsResult = await api.getAllTournaments();
        if (tournamentsResult.success) {
          setTournaments(tournamentsResult.data || []);
        }
      } else {
        const errorMsg = (result as any).error || 'Failed to update match';
        console.error('Error updating match:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  };

  const addAd = async (ad: Ad) => {
    try {
      const result = await api.addAd(ad);
      if (result.success) {
        setAds([...ads, result.data]);
      } else {
        const errorMsg = (result as any).error || 'Failed to add ad';
        console.error('Error adding ad:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error adding ad:', error);
      throw error;
    }
  };

  const updateAd = async (ad: Ad) => {
    try {
      const result = await api.updateAd(ad.id, ad);
      if (result.success) {
        setAds(ads.map(a => a.id === ad.id ? result.data : a));
      } else {
        const errorMsg = (result as any).error || 'Failed to update ad';
        console.error('Error updating ad:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating ad:', error);
      throw error;
    }
  };

  const deleteAd = async (id: string) => {
    try {
      const result = await api.deleteAd(id);
      if (result.success) {
        setAds(ads.filter(a => a.id !== id));
      } else {
        const errorMsg = (result as any).error || 'Failed to delete ad';
        console.error('Error deleting ad:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        tournaments,
        currentMatch,
        ads,
        loading,
        addTournament,
        updateTournament,
        deleteTournament,
        setCurrentMatch,
        updateMatch,
        addAd,
        updateAd,
        deleteAd,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
