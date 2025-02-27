"use client"

import { Button } from '@/components/ui/button';
import * as PlayerComponent from '../players/CreatePlayer';
import { useState } from 'react';
import ManagerModal from '@/components/modals/modals.create-manager';
import { Manager } from '@prisma/client';
import { createManagerAction } from '../action/manager/createManagerAction';
import { Loader } from '@/components/loader';
import { redirect } from 'next/navigation';

const ParentComponent = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveManager = async (formData: FormData) => {
        setIsLoading(true);
        try {
            const response = await createManagerAction(formData);
            console.log('Manager saved:', response);

            if (!response) throw new Error('Something went wrong');
            redirect("/managers");
        } catch (error) {
            console.error('Error saving manager:', error);
        } finally {
            setIsLoading(false);
            setIsModalOpen(false);
        }
    };

    if (isLoading) return (<Loader title="Creating Manager..." />)

    return (
        <>
            <Button onClick={() => setIsModalOpen(true)}>Add Manager</Button>
            <ManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveManager}
            />
        </>
    );
};

export default ParentComponent;
