"use client"

import { createManagerAction } from '@/app/action/manager/createManagerAction';
import { Manager } from '@prisma/client';
import { PlusIcon } from 'lucide-react';
import React, { useState } from 'react';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => void;
}

const ManagerModal = ({ isOpen, onClose, onSave }: ManagerModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      const formData = new FormData(event.currentTarget);
      const response = await createManagerAction(formData);

      if (!response) throw new Error('Something went wrong');
      
      onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal is-active">
        <div className="modal-background" onClick={onClose}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Create Manager</p>
            <button className="delete" aria-label="close" onClick={onClose}></button>
          </header>
          <section className="modal-card-body">
            <div className="has-text-centered mb-4">
              <PlusIcon />
            </div>
            <div className="field">
              <label className="label" htmlFor="name">Name</label>
              <div className="control">
                <input
                  id="name"
                  name="name"
                  className="input"
                  type="text"
                  placeholder="Enter manager name"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </section>
          <footer className="modal-card-foot">
            <button type="submit" className="button is-success" disabled={isLoading}>
              Save changes
            </button>
            <button type="button" className="button" onClick={onClose}>
              Cancel
            </button>
          </footer>
        </div>
      </div>
    </form>
  );
};

export default ManagerModal;
