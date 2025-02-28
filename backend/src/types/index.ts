type Player = {
    id: string;
    displayName: string;
    gamesPlayed: number;
    teamId: string;
}

type Team = {
    id: string;
    name: string;
    players: Player[];
}

// add type for PlayerStats
