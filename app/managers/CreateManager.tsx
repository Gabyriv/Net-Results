import { Button } from '@/components/ui/button';
import ParentComponent from '../players/CreatePlayer';
"use client"

//import




const ParentComponent = () => {
    const [isLoading, setIsLOading] = useState(flase);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveManager = (managerData: Manager) => {
        console.log('Saving Manager:', managerData);

        //Save manager to DB
        try {
            setIsLOading(true);
          const response = createManagerAction(managerData);
            console.log('Manager saved:', response);
            
        } catch (error) {
            console.error('Error saving manager:', error);
        }
        finally (
            setIsLoading(false);
        )

    };

    return (
        <div>
            {
                isLoading && <p>Creating Manager...</p>
            }

            {
                !isLoading &&
                <>
                    <Button onClick={() => setIsModalOpen(true)}>Become a Manager</Button>
                        <ManagerModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveManager}
                        />
                </>
            }
        </div>
    );
};

export default ParentComponent;