import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Folder {
  id: string;
  name: string;
  color: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export function useFolders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFolders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch folders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name
        })
        .select()
        .single();

      if (error) throw error;
      
      setFolders(prev => [...prev, data]);
      toast({
        title: "Success",
        description: `Folder "${name}" created successfully.`
      });
      
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateFolder = async (id: string, updates: Partial<Pick<Folder, 'name' | 'color' | 'description'>>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setFolders(prev => prev.map(folder => folder.id === id ? data : folder));
      toast({
        title: "Success",
        description: "Folder updated successfully."
      });
      
      return data;
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: "Error",
        description: "Failed to update folder. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteFolder = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setFolders(prev => prev.filter(folder => folder.id !== id));
      toast({
        title: "Success",
        description: "Folder deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const moveContentToFolder = async (contentId: string, folderId: string | null) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('content_items')
        .update({ folder_id: folderId })
        .eq('id', contentId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Content moved ${folderId ? 'to folder' : 'to all content'} successfully.`
      });
    } catch (error) {
      console.error('Error moving content:', error);
      toast({
        title: "Error",
        description: "Failed to move content. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [user]);

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveContentToFolder,
    refetch: fetchFolders
  };
}