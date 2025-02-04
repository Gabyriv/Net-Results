"use client"

import PlayerModal from '@/components/modals/modals.create-player';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { createPlayerAction } from '../action/player/createPlayerAction';

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

  return (
    <div>
  {
    isLoading && <p>Creating Player...</p>
  }
  
  {
    !isLoading &&   
    <>
      <Button onClick={() => setIsModalOpen(true)}>Add Player</Button>
        <PlayerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePlayer}
        />
    </>
  }


    </div>
  );
};

export default ParentComponent;
