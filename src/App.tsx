import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';
import TournamentSelection from './pages/TournamentSelection';
import TournamentDashboard from './pages/TournamentDashboard';
import TeamManagement from './pages/TeamManagement';
import AdManagement from './pages/AdManagement';
import MatchList from './pages/MatchList';
import TournamentSettings from './pages/TournamentSettings';
import Statistics from './pages/Statistics';
import MatchSetup from './pages/MatchSetup';
import Scoring from './pages/Scoring';
import NetworkScoreboard from './pages/NetworkScoreboard';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TournamentSelection />} />
          <Route path="/tournament/:id/dashboard" element={<TournamentDashboard />} />
          <Route path="/tournament/:id/teams" element={<TeamManagement />} />
          <Route path="/tournament/:id/ads" element={<AdManagement />} />
          <Route path="/tournament/:id/matches" element={<MatchList />} />
          <Route path="/tournament/:id/settings" element={<TournamentSettings />} />
          <Route path="/tournament/:id/stats" element={<Statistics />} />
          <Route path="/match-setup/:tournamentId" element={<MatchSetup />} />
          <Route path="/scoring" element={<Scoring />} />
          <Route path="/scoreboard" element={<NetworkScoreboard />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 6000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
        containerStyle={{
          top: 20,
          right: 20,
        }}
      />
    </AppProvider>
  );
}

export default App;
