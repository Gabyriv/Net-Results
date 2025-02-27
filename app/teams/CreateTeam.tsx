"use client"

import { useState } from 'react';
import * as ManagerComponent from '../managers/CreateManager';
import { createTeamAction } from '../action/Teams/createTeamAction';
import { Button } from '@/components/ui/button';
import TeamModal from '@/components/modals/modal.create-team';
import { Team } from '@prisma/client';

const ParentComponent = () => {
    const [isLoading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSaveTeam = (teamData: Team) => {
        console.log('Saving Team:', teamData);

        // Save team to database
        try {
            setLoading(true);
            const response = createTeamAction(teamData);

            if (!response) throw new Error('Something went wrong');
            
            console.log('Team saved:', response);
        
            setModalOpen(false);

        } catch (error) {
            console.error('Error saving team:', error);
        }
        finally {
            setLoading(false);
        }
    };

  if (isLoading) return (<p>Creating Team...</p>)

    return (

            <>
            <Button onClick={() => setModalOpen(true)}>Add Team</Button>
            <TeamModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            onSave={handleSaveTeam}
            />
            </>
     
    );
};
