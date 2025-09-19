import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Folder,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface FolderItem {
  id: string;
  name: string;
  color: string;
  itemCount: number;
}

interface FolderSidebarProps {
  folders: FolderItem[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: FolderItem) => void;
  onDeleteFolder: (folderId: string) => void;
}

const getColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500',
    green: 'text-success',
    purple: 'text-purple-500',
    orange: 'text-warning',
    red: 'text-destructive',
    gray: 'text-muted-foreground',
  };
  return colorMap[color] || 'text-blue-500';
};

export function FolderSidebar({ 
  folders, 
  selectedFolderId, 
  onSelectFolder, 
  onCreateFolder, 
  onEditFolder, 
  onDeleteFolder 
}: FolderSidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-muted/20 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">My Folders</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCreateFolder}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant={selectedFolderId === null ? "secondary" : "ghost"}
        className="w-full justify-start"
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="h-4 w-4 mr-2" />
        All Content
        <Badge variant="secondary" className="ml-auto">
          {folders.reduce((total, folder) => total + folder.itemCount, 0)}
        </Badge>
      </Button>

      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`group flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer ${
                selectedFolderId === folder.id ? 'bg-muted' : ''
              }`}
            >
              <div 
                className="flex-1 flex items-center gap-2 min-w-0"
                onClick={() => onSelectFolder(folder.id)}
              >
                <Folder className={`h-4 w-4 flex-shrink-0 ${getColorClass(folder.color)}`} />
                <span className="text-sm truncate">{folder.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {folder.itemCount}
                </Badge>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDeleteFolder(folder.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}