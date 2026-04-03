import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { 
  auth, 
  firestore, 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  arrayRemove,
  deleteDoc,
  addDoc,
  collection,
  getDocs,
  where,
  query,
  serverTimestamp
} from '../../firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

type Player = {
  id: string | null;
  name: string | null;
  level: number | string | null;
  team: 1 | 2;
  avatar?: string;
};

type Match = {
  id: string;
  club: string;
  date: string;
  time: string;
  levelMin: number;
  levelMax: number;
  pricePerPlayer: number;
  players: Player[];
  playerIds: string[];
  createdBy: string;
  status: string;
  isMixed: boolean;
  isCompetitive: boolean;
  isPrivate?: boolean;
  result?: string;
  winnerTeam?: 1 | 2;
  tempScore?: string;
  tempWinnerTeam?: 1 | 2;
  scoreStatus?: 'pending_approval' | 'approved';
  scoreSubmittedBy?: string;
};

type JoinRequest = {
  id: string;
  matchId: string;
  userId: string;
  userName?: string;
  userLevel?: string | number;
  userAvatar?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  requestedTeam: 1 | 2;
};

// ─── Player Tile ──────────────────────────────────────────────────────────────

function PlayerTile({ player }: { player: Player }) {
  const isEmpty = !player.id;
  const currentUserId = auth.currentUser?.uid;
  const isYou = player.id === currentUserId;

  return (
    <View style={[styles.playerTile, isEmpty && styles.playerTileEmpty]}>
      {isEmpty ? (
        <View style={styles.emptyAvatar}>
          <Ionicons name="person-add-outline" size={22} color="#ccc" />
        </View>
      ) : (
        <Avatar uri={player.avatar} size={40} />
      )}
      <Text style={[styles.playerName, isEmpty && { color: '#bbb' }]} numberOfLines={1}>
        {isEmpty ? 'Open plek' : player.name}{isYou ? ' (jij)' : ''}
      </Text>
      {!isEmpty && (
        <View style={styles.levelChip}>
          <Text style={styles.levelChipText}>
            {typeof player.level === 'number' ? player.level.toFixed(1) : player.level || '?'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<JoinRequest | null>(null);
  const [checkingRequest, setCheckingRequest] = useState(false);

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
    if (!id) return;
    try {
      const docRef = doc(firestore, 'matches', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Match;
        setMatch({ id: docSnap.id, ...data } as Match);

        // Self-healing logic: If current user is a participant, ensure their info is up-to-date
        const user = auth.currentUser;
        if (user) {
          const players = data.players || [];
          const userIndex = players.findIndex(p => p.id === user.uid);
          if (userIndex !== -1) {
            const userDoc = await getDoc(doc(firestore, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const latestName = userData.username || user.displayName || 'Speler';
              const latestAvatar = userData.avatar || '';
              
              if (players[userIndex].name !== latestName || players[userIndex].avatar !== latestAvatar) {
                console.log('Updating stale user info in match document...');
                const updatedPlayers = [...players];
                updatedPlayers[userIndex] = {
                  ...updatedPlayers[userIndex],
                  name: latestName,
                  avatar: latestAvatar
                };
                await updateDoc(docRef, { players: updatedPlayers });
                // Re-fetch or update local state
                setMatch(prev => prev ? { ...prev, players: updatedPlayers } : null);
              }
            }
          }

          // Check for pending join request if match is private
          if (data.isPrivate) {
            await checkForPendingRequest(docSnap.id as string, user.uid);
          }
        }
      } else {
        Alert.alert('Fout', 'Wedstrijd niet gevonden.');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching match:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForPendingRequest = async (matchId: string, userId: string) => {
    try {
      const q = query(
        collection(firestore, 'joinRequests'),
        where('matchId', '==', matchId),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setPendingRequest({ id: snap.docs[0].id, ...snap.docs[0].data() } as JoinRequest);
      } else {
        setPendingRequest(null);
      }
    } catch (error) {
      console.error('Error checking pending request:', error);
    }
  };

  const handleJoinRequest = async () => {
    const user = auth.currentUser;
    if (!user || !match) return;

    setJoining(true);
    try {
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      const emptyIndex = match.players.findIndex(p => !p.id);
      if (emptyIndex === -1) {
        Alert.alert('Fout', 'Deze wedstrijd is al vol.');
        setJoining(false);
        return;
      }

      const requestedTeam = match.players[emptyIndex].team;

      const joinRequestData = {
        matchId: match.id,
        userId: user.uid,
        userName: userData?.username || user.displayName || user.email?.split('@')[0] || 'Speler',
        userLevel: userData?.level || '?',
        userAvatar: userData?.avatar || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        requestedTeam: requestedTeam as 1 | 2
      };

      const docRef = await addDoc(collection(firestore, 'joinRequests'), joinRequestData);

      // Create notification for match creator
      await addDoc(collection(firestore, 'notifications'), {
        userId: match.createdBy,
        type: 'join_request',
        status: 'unread',
        requestId: docRef.id,
        matchId: match.id,
        matchClub: match.club,
        matchDate: match.date,
        matchTime: match.time,
        requesterName: joinRequestData.userName,
        requesterLevel: joinRequestData.userLevel,
        requesterAvatar: joinRequestData.userAvatar,
        createdAt: serverTimestamp(),
        title: 'Nieuw verzoek om toe te treden',
        body: `${joinRequestData.userName} (niveau ${joinRequestData.userLevel}) vraagt om in te schrijven voor je wedstrijd op ${match.club}.`,
      });

      setPendingRequest({ 
        id: docRef.id, 
        ...joinRequestData 
      } as JoinRequest);
      Alert.alert('Succes', 'Je aanvraag is verzonden! De match-creator zal je verzoek beoordelen.');

    } catch (error) {
      console.error('Error sending join request:', error);
      Alert.alert('Fout', 'Kon je aanvraag niet versturen. Probeer het later opnieuw.');
    } finally {
      setJoining(false);
    }
  };

  const handleCancelRequest = async () => {
    const user = auth.currentUser;
    if (!user || !pendingRequest) return;

    setJoining(true);
    try {
      await deleteDoc(doc(firestore, 'joinRequests', pendingRequest.id));
      setPendingRequest(null);
      Alert.alert('Succes', 'Je aanvraag is ingetrokken.');
    } catch (error) {
      console.error('Error canceling request:', error);
      Alert.alert('Fout', 'Kon je aanvraag niet intrekken. Probeer het later opnieuw.');
    } finally {
      setJoining(false);
    }
  };

  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Fout', 'Je moet ingelogd zijn om je in te schrijven.');
      return;
    }

    if (!match) return;

    if (match.playerIds.includes(user.uid)) {
      Alert.alert('Info', 'Je zit al in deze wedstrijd!');
      return;
    }

    // For private matches, send a request instead
    if (match.isPrivate) {
      await handleJoinRequest();
      return;
    }

    const players = match.players;
    const team1Count = players.filter(p => p.team === 1 && p.id).length;
    const team2Count = players.filter(p => p.team === 2 && p.id).length;

    // Prefer team with fewer players
    const preferredTeam = team1Count <= team2Count ? 1 : 2;
    
    // Find first empty slot in preferred team, if none, try the other team
    let targetIndex = players.findIndex(p => !p.id && p.team === preferredTeam);
    if (targetIndex === -1) {
      targetIndex = players.findIndex(p => !p.id);
    }

    if (targetIndex === -1) {
      Alert.alert('Fout', 'Deze wedstrijd is al vol.');
      return;
    }

    setJoining(true);
    try {
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      const newPlayer: Player = {
        id: user.uid,
        name: userData?.username || user.displayName || user.email?.split('@')[0] || 'Speler',
        level: userData?.level || '?',
        team: players[targetIndex].team,
        avatar: userData?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE2IiBmaWxsPSIjY2NjIi8+CjxwYXRoIGQ9Ik0yMCA3NWMwLTEwLjUgOC41LTE5IDE5LTE5czE5IDguNSAxOSA5djE1YzAgMTAuNS04LjUgMTktMTkgMTlzLTE5LTguNS0xOS0xOVoiIGZpbGw9IiNjY2MiLz4KPC9zdmc+'
      };

      const updatedPlayers = [...players];
      updatedPlayers[targetIndex] = newPlayer;

      const matchRef = doc(firestore, 'matches', match.id);
      const isNowFull = updatedPlayers.filter(p => !p.id).length === 0;

      await updateDoc(matchRef, {
        players: updatedPlayers,
        playerIds: arrayUnion(user.uid),
        status: isNowFull ? 'full' : 'open'
      });

      // Update all-time match history for the user
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        allTimeMatchIds: arrayUnion(match.id)
      }).catch(err => console.error('Error updating join history:', err));

      Alert.alert('Succes', 'Je bent ingeschreven!');
      fetchMatch();

    } catch (error) {
      console.error('Error joining match:', error);
      Alert.alert('Fout', 'Kon niet inschrijven. Probeer het later opnieuw.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    const user = auth.currentUser;
    if (!user || !match) return;

    const performLeave = async () => {
      setLeaving(true);
      try {
        const updatedPlayers = [...match.players];
        const userIndex = updatedPlayers.findIndex(p => p.id === user.uid);

        if (userIndex !== -1) {
          updatedPlayers[userIndex] = {
            id: null,
            name: null,
            level: null,
            team: updatedPlayers[userIndex].team
          };

          const matchRef = doc(firestore, 'matches', match.id);
          const noPlayersLeft = updatedPlayers.every(p => p.id === null);

          if (noPlayersLeft) {
            await deleteDoc(matchRef);
            if (Platform.OS !== 'web') Alert.alert('Succes', 'Wedstrijd verwijderd omdat er geen spelers meer zijn.');
            router.back();
            return;
          }

          await updateDoc(matchRef, {
            players: updatedPlayers,
            playerIds: arrayRemove(user.uid),
            status: 'open'
          });

          if (Platform.OS !== 'web') Alert.alert('Succes', 'Je bent uitgeschreven.');
          fetchMatch();
        }
      } catch (error) {
        console.error('Error leaving match:', error);
        Alert.alert('Fout', 'Kon niet uitschrijven. Probeer het later opnieuw.');
      } finally {
        setLeaving(false);
      }
    };

    const confirmMsg = 'Weet je zeker dat je je wilt uitschrijven voor deze wedstrijd?';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        await performLeave();
      }
    } else {
      Alert.alert('Uitschrijven', confirmMsg, [
        { text: 'Annuleren', style: 'cancel' },
        { text: 'Uitschrijven', style: 'destructive', onPress: performLeave }
      ]);
    }
  };

  const handleApproveScore = async () => {
    const user = auth.currentUser;
    if (!user || !match) return;

    setLoading(true);
    try {
      const matchRef = doc(firestore, 'matches', match.id);
      const winnerTeam = match.tempWinnerTeam;
      const finalScore = match.tempScore;

      // Update match document
      await updateDoc(matchRef, {
        result: finalScore,
        winnerTeam: winnerTeam,
        scoreStatus: 'approved',
        scoreApprovedBy: user.uid,
        status: 'completed'
      });

      // Update player stats for all 4 players
      for (const player of match.players) {
        if (player.id) {
          const userRef = doc(firestore, 'users', player.id);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const isWinner = player.team === winnerTeam;
            
            const currentWins = userData.wins || 0;
            const currentLosses = userData.losses || 0;
            const currentLevel = userData.level || 2.5;
            
            let newLevel = currentLevel;
            if (match.isCompetitive) {
              // Simple level adjustment: +0.1 for win, -0.05 for loss (capped between 1.0 and 7.0)
              newLevel = isWinner 
                ? Math.min(7.0, currentLevel + 0.1) 
                : Math.max(1.0, currentLevel - 0.05);
            }

            await updateDoc(userRef, {
              wins: isWinner ? currentWins + 1 : currentWins,
              losses: isWinner ? currentLosses : currentLosses + 1,
              level: newLevel
            });
          }
        }
      }

      Alert.alert('Succes', 'Het resultaat is goedgekeurd en de rankings zijn bijgewerkt!');
      fetchMatch();
    } catch (error) {
      console.error('Error approving score:', error);
      Alert.alert('Fout', 'Kon het resultaat niet goedkeuren.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectScore = async () => {
    if (!match) return;
    try {
      const matchRef = doc(firestore, 'matches', match.id);
      await updateDoc(matchRef, {
        scoreStatus: null,
        tempScore: null,
        tempWinnerTeam: null,
        scoreSubmittedBy: null
      });
      Alert.alert('Info', 'Het resultaat is geweigerd. Er kan nu een nieuw resultaat worden ingevoerd.');
      fetchMatch();
    } catch (error) {
      console.error('Error rejecting score:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  if (!match) return null;

  const team1 = match.players.filter((p) => p.team === 1);
  const team2 = match.players.filter((p) => p.team === 2);
  const spotsLeft = match.players.filter((p) => !p.id).length;
  const isParticipant = auth.currentUser ? match.playerIds.includes(auth.currentUser.uid) : false;
  const today = new Date().toISOString().split('T')[0];
  const isPast = match.date <= today; // Inclusief vandaag

  const userTeam = match.players.find(p => p.id === auth.currentUser?.uid)?.team;
  const submitterTeam = match.players.find(p => p.id === match.scoreSubmittedBy)?.team;
  
  const opponentSubmitted = match.scoreStatus === 'pending_approval' && 
                            match.scoreSubmittedBy !== auth.currentUser?.uid &&
                            submitterTeam !== userTeam;
                            
  const youSubmitted = match.scoreStatus === 'pending_approval' && 
                       (match.scoreSubmittedBy === auth.currentUser?.uid || submitterTeam === userTeam);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wedstrijddetails</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-social-outline" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.titleBlock}>
          <View style={{ flex: 1 }}>
            <Text style={styles.courtName}>{match.club}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#999" />
              <Text style={styles.locationText}>{match.club} · Antwerpen</Text>
            </View>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceValue}>€{match.pricePerPlayer || 10}</Text>
            <Text style={styles.priceUnit}>/pers</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          {[
            { icon: 'calendar-outline', label: match.date },
            { icon: 'time-outline',     label: match.time },
            { icon: 'trophy-outline',    label: match.isCompetitive ? 'Competitief' : 'Vriendschappelijk' },
            { icon: 'tennisball-outline', label: 'Padel' },
            match.isPrivate && { icon: 'lock-closed-outline', label: 'Privé' },
          ].filter(Boolean).map((chip, idx) => (
            <View key={idx} style={styles.infoChip}>
              <Ionicons name={chip.icon as any} size={15} color="#00A86B" />
              <Text style={styles.infoChipText}>{chip.label}</Text>
            </View>
          ))}
        </View>

        {/* Result Card for Past Matches */}
        {isPast && isParticipant && (
          <View style={[styles.card, { borderColor: '#00A86B', borderWidth: match.scoreStatus === 'approved' ? 2 : 0 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy-outline" size={18} color="#00A86B" />
              <Text style={styles.cardTitle}>Wedstrijd Resultaat</Text>
              {match.scoreStatus === 'approved' && (
                <View style={styles.approvedBadge}>
                  <Text style={styles.approvedBadgeText}>BEVESTIGD</Text>
                </View>
              )}
            </View>
            
            {match.scoreStatus === 'approved' ? (
              <View style={styles.resultDisplay}>
                <Text style={styles.finalScore}>{match.result}</Text>
                <Text style={styles.winnerLabel}>
                  Winnaar: Team {match.winnerTeam}
                </Text>
              </View>
            ) : match.scoreStatus === 'pending_approval' ? (
              <View style={styles.pendingResultDisplay}>
                <Text style={styles.pendingScoreLabel}>Ingediende score:</Text>
                <Text style={styles.pendingScoreValue}>{match.tempScore}</Text>
                <Text style={styles.pendingWinnerLabel}>
                  Aangeduide winnaar: Team {match.tempWinnerTeam}
                </Text>
                {youSubmitted ? (
                  <Text style={styles.waitText}>Wachten op goedkeuring van de tegenstander...</Text>
                ) : (
                  <Text style={styles.actionText}>Gelieve dit resultaat te bevestigen of te weigeren.</Text>
                )}
              </View>
            ) : (
              <View style={styles.noResultDisplay}>
                <Text style={styles.noResultText}>Er is nog geen resultaat ingevoerd voor deze wedstrijd.</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Teams</Text>
            {spotsLeft > 0 && (
              <View style={styles.spotsChip}>
                <Text style={styles.spotsChipText}>{spotsLeft} plek vrij</Text>
              </View>
            )}
          </View>

          <View style={styles.teamsWrap}>
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel}>Team 1</Text>
              {team1.map((p, idx) => <PlayerTile key={idx} player={p} />)}
            </View>
            <View style={styles.vsCol}>
              <View style={styles.vsCircle}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            </View>
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel}>Team 2</Text>
              {team2.map((p, idx) => <PlayerTile key={idx} player={p} />)}
            </View>
          </View>

          <View style={styles.dotsRow}>
            {match.players.map((p, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  !p.id ? styles.dotEmpty : styles.dotFilled,
                ]}
              />
            ))}
            <Text style={styles.dotsLabel}>
              {match.players.filter((p) => p.id).length}/4 spelers
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Vereist Niveau</Text>
          </View>
          <Text style={styles.levelText}>
            Deze wedstrijd is voor spelers met een niveau tussen {match.levelMin.toFixed(1)} en {match.levelMax.toFixed(1)}.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.cta}>
        {isPast && isParticipant ? (
          <>
            {match.scoreStatus === 'approved' ? (
              <View style={[styles.confirmBtn, { backgroundColor: '#f0faf6', borderWidth: 1, borderColor: '#00A86B' }]}>
                <Text style={[styles.confirmBtnText, { color: '#00A86B' }]}>Resultaat bekeken</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color="#00A86B" />
              </View>
            ) : match.scoreStatus === 'pending_approval' ? (
              opponentSubmitted ? (
                <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
                  <TouchableOpacity 
                    style={[styles.confirmBtn, { backgroundColor: '#FDECEA', borderColor: '#E53935', borderWidth: 1, flex: 1 }]} 
                    onPress={handleRejectScore}
                  >
                    <Text style={[styles.confirmBtnText, { color: '#E53935' }]}>Weigeren</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.confirmBtn, { flex: 2 }]} 
                    onPress={handleApproveScore}
                  >
                    <Text style={styles.confirmBtnText}>Goedkeuren</Text>
                    <Ionicons name="checkmark-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.confirmBtn, { backgroundColor: '#eee' }]}>
                  <Text style={[styles.confirmBtnText, { color: '#999' }]}>Wachten op goedkeuring</Text>
                  <ActivityIndicator size="small" color="#999" />
                </View>
              )
            ) : (
              <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={() => router.push({ pathname: '/(screens)/enterMatchResult', params: { id: match.id } })}
              >
                <Text style={styles.confirmBtnText}>Resultaat invoeren</Text>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => router.back()}
            >
              <Text style={styles.cancelBtnText}>Terug</Text>
            </TouchableOpacity>
            
            {isParticipant ? (
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: '#FDECEA', borderWidth: 1, borderColor: '#E53935' }]} 
                onPress={handleLeave}
                disabled={leaving}
              >
                {leaving ? (
                  <ActivityIndicator color="#E53935" size="small" />
                ) : (
                  <>
                    <Text style={[styles.confirmBtnText, { color: '#E53935' }]}>Uitschrijven</Text>
                    <Ionicons name="exit-outline" size={18} color="#E53935" />
                  </>
                )}
              </TouchableOpacity>
            ) : pendingRequest ? (
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: '#FFF3CD', borderWidth: 1, borderColor: '#F5A623' }]} 
                onPress={handleCancelRequest}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator color="#F5A623" size="small" />
                ) : (
                  <>
                    <Text style={[styles.confirmBtnText, { color: '#F5A623' }]}>Intrekken</Text>
                    <Ionicons name="hourglass-outline" size={18} color="#F5A623" />
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.confirmBtn, (spotsLeft === 0 || joining) && styles.disabledBtn]} 
                onPress={handleJoin}
                disabled={spotsLeft === 0 || joining}
              >
                {joining ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.confirmBtnText}>
                      {match.isPrivate ? 'Aanvragen' : 'Inschrijven'}
                    </Text>
                    <Ionicons 
                      name={match.isPrivate ? "send-outline" : "person-add-outline"} 
                      size={18} 
                      color="#fff" 
                    />
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  shareBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  scroll: { paddingBottom: 20 },
  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 16, marginBottom: 12, marginTop: 10 },
  courtName: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: '#999' },
  priceBox: { alignItems: 'flex-end', marginLeft: 12 },
  priceValue: { fontSize: 26, fontWeight: '900', color: '#00A86B' },
  priceUnit: { fontSize: 12, color: '#999', marginTop: -2 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginBottom: 14 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  infoChipText: { fontSize: 13, fontWeight: '600', color: '#444' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  spotsChip: { backgroundColor: '#f0faf6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#c3e6d8' },
  spotsChipText: { fontSize: 11, color: '#00A86B', fontWeight: '700' },
  teamsWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  teamCol: { flex: 1, gap: 10 },
  teamLabel: { fontSize: 11, fontWeight: '700', color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, textAlign: 'center' },
  vsCol: { alignItems: 'center', justifyContent: 'center', paddingTop: 30 },
  vsCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  vsText: { fontSize: 13, fontWeight: '900', color: '#bbb' },
  playerTile: { alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 12, padding: 10, gap: 6 },
  playerTileEmpty: { borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', backgroundColor: '#fafafa' },
  playerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  emptyAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  playerName: { fontSize: 11, fontWeight: '700', color: '#333', textAlign: 'center' },
  levelChip: { backgroundColor: '#e8f8f2', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  levelChipText: { fontSize: 11, color: '#00A86B', fontWeight: '800' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotFilled: { backgroundColor: '#00A86B' },
  dotEmpty: { backgroundColor: '#e0e0e0' },
  dotsLabel: { fontSize: 12, color: '#999', marginLeft: 4, fontWeight: '500' },
  levelText: { fontSize: 14, color: '#666', lineHeight: 20 },
  
  // Result styles
  approvedBadge: { backgroundColor: '#e8f8f2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#00A86B' },
  approvedBadgeText: { fontSize: 10, color: '#00A86B', fontWeight: '800' },
  resultDisplay: { alignItems: 'center', paddingVertical: 10 },
  finalScore: { fontSize: 32, fontWeight: '900', color: '#1a1a1a', letterSpacing: 2 },
  winnerLabel: { fontSize: 14, fontWeight: '700', color: '#00A86B', marginTop: 4 },
  pendingResultDisplay: { gap: 4 },
  pendingScoreLabel: { fontSize: 12, color: '#999', fontWeight: '600' },
  pendingScoreValue: { fontSize: 24, fontWeight: '800', color: '#333' },
  pendingWinnerLabel: { fontSize: 13, fontWeight: '700', color: '#555' },
  waitText: { fontSize: 12, color: '#F5A623', fontStyle: 'italic', marginTop: 8 },
  actionText: { fontSize: 12, color: '#00A86B', fontWeight: '600', marginTop: 8 },
  noResultDisplay: { paddingVertical: 10 },
  noResultText: { fontSize: 14, color: '#999', textAlign: 'center', fontStyle: 'italic' },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#999' },
  confirmBtn: { flex: 2, backgroundColor: '#00A86B', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  disabledBtn: { backgroundColor: '#b2dfce' },
});
