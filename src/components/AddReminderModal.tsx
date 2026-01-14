"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";

interface AddReminderModalProps {
  onReminderAdded?: () => void;
}

export default function AddReminderModal({ onReminderAdded }: AddReminderModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reminderDate: "",
    reminderType: "GENERAL",
    priority: "MEDIUM"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.reminderDate) {
      toast.error("Title and reminder date are required");
      return;
    }

    // Validate the date format
    const dateTest = new Date(formData.reminderDate);
    if (isNaN(dateTest.getTime())) {
      console.error("Invalid date provided:", formData.reminderDate);
      toast.error("Please enter a valid reminder date");
      return;
    }

    console.log("Sending reminder data:", {
      ...formData,
      parsedDate: dateTest.toISOString()
    });

    try {
      setLoading(true);
      
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          reminderDate: formData.reminderDate
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Reminder created successfully!");
        setFormData({
          title: "",
          description: "",
          reminderDate: "",
          reminderType: "GENERAL",
          priority: "MEDIUM"
        });
        setOpen(false);
        onReminderAdded?.();
      } else {
        throw new Error(result.error || "Failed to create reminder");
      }
    } catch (error: any) {
      console.error("Error creating reminder:", error);
      toast.error(error.message || "Failed to create reminder");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Reminder
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] bg-black/95 backdrop-blur-sm" aria-describedby="add-reminder-desc">
        <DialogHeader>
          <DialogTitle>Create New Reminder</DialogTitle>
        </DialogHeader>
        <p id="add-reminder-desc" className="sr-only">Create a reminder to follow up with leads at the specified date and time.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter reminder title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="reminderDate">Date & Time *</Label>
            <Input
              id="reminderDate"
              type="datetime-local"
              value={formData.reminderDate}
              onChange={(e) => handleInputChange("reminderDate", e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          <div>
            <Label htmlFor="reminderType">Type</Label>
            <Select 
              value={formData.reminderType} 
              onValueChange={(value: string) => handleInputChange("reminderType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reminder type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CALL">Call</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="TASK">Task</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value: string) => handleInputChange("priority", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Reminder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}