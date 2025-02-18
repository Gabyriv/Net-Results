import { PlusIcon } from "lucide-react";
import { useState } from "react";




interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (team: Team) => void;
}

const TeamModal = ({isOpen, onClose, onSave } : TeamModalProps) => {
    const [teamName, setTeamName] = useState('');

    const handleSave = () => {
        onSave({ id: "1", name: teamName, teamId: "1"});
        setTeamName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal is-active">
            <div className="modal-background" onClick={onClose}></div>
            <div className="modal-card">
                <header className="modal-card-head">
                    <p className="modal-card-title">Create Team</p>
                    <button className="delete" aria-label="close" onClick={onClose}></button>
                </header>
                <section className="modal-card-body">
                    <div className="has-text-centered mb-4">
                        <PlusIcon />

                    </div>
                    <div className="field">
                        <label className="label">Name</label>
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                placeholder="Enter team name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}/>
                        </div>
                    </div>
                </section>
                <footer className="modal-card-foot">
                    <button className="button is-success" onClick={handleSave}>Save Changes</button>
                    <button className="button" onClick={onClose}>Cancel</button>
                </footer>
            </div>
        </div>
    );
};

export default TeamModal;