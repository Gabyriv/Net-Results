"use client"
import { useState } from 'react';
import ParentComponent from '../managers/CreateManager';
import { createTeamAction } from '../action/Teams/createTeamAction';
import { Button } from '@/components/ui/button';
import TeamModal from '@/components/modals/modal.create-team';



const ParentComponent = () => {
    const [isLoading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSaveTeam = (teamData: Team) => {
        console.log('Saving Team:', teamData);

        // Save team to database
        try {
            setLoading(true);
            const response = createTeamAction(teamData);
        } catch (error) {
            console.error('Error saving team:', error);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div>
        {
            isLoading && <p>Creating Template</p>
        }

        {
            !isLoading &&
            <>
            <Button onClick={() => setModalOpen(true)}>Add Team</Button>
            <TeamModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            onSave={handleSaveTeam}
            />
            </>
        }
        </div>
    );
};

export default ParentComponent;