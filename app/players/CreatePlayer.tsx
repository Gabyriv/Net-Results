"use client"

import PlayerModal from '@/components/modals/modals.create-player';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { createPlayerAction } from '../action/player/createPlayerAction';
import { Player } from '@prisma/client';

const ParentComponent = () => {
    const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSavePlayer = (playerData: Player) => {
    console.log('Saving player:', playerData);

    // Save player to database
    try {
        setIsLoading(true);
      const response = createPlayerAction(playerData);
        console.log('Player saved:', response);

    } catch (error) {
      console.error('Error saving player:', error);
    }
    finally {
      setIsLoading(false);
    }

  };

  if (isLoading) return (<p>Creating Player...</p>)
    
  return (
   
    <>
      <Button onClick={() => setIsModalOpen(true)}>Add Player</Button>
        <PlayerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePlayer}
        />
    </>
  )
};

export default ParentComponent;