"use client"

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuickLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickLogModal({ open, onOpenChange }: QuickLogModalProps) {
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // TODO: Call backend API to create time entry
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Time entry logged successfully!');
      onOpenChange(false);

      // Reset form
      setDescription('');
      setDuration('');

      // TODO: Mutate SWR cache to refresh today's stats
    } catch (error) {
      toast.error('Failed to log time entry');
      console.error('Error logging time entry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Log Time Entry</DialogTitle>
          <DialogDescription>
            Quickly log a completed time entry
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              step="0.25"
              min="0.25"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="2.5"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Logging...' : 'Log Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
