import { Database, HardDrive, Upload } from 'lucide-react'
import React from 'react'
import { SavedRequestList } from '../RequestLayout/SavedRequestList'
import { ModeToggle } from '../Theme/Modetoggle';

type SidebarParams = {
    toggleStorage: () => void;
    storageLoading: boolean;
    syncToDatabase: () => void;
    useDatabase: boolean;
    savedRequests: SavedRequest[];
    activeRequestId: string | null;
    handleLoadRequest: (id: string) => void;
    handleDeleteRequest: (id: string, e: React.MouseEvent) => void;
}

interface SavedRequest {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
  createdAt?: string;
}


export const Sidebar = ({
    toggleStorage,
    storageLoading,
    syncToDatabase,
    useDatabase,
    savedRequests,
    activeRequestId,
    handleLoadRequest,
    handleDeleteRequest
} : SidebarParams) => {
  return (
        <aside className="w-64 min-h-screen border-r bg-muted/30 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Saved Requests</h2>
            {/* Storage Toggle */}
            <button
              onClick={toggleStorage}
              disabled={storageLoading}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                useDatabase
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
              title={useDatabase ? "Using Database" : "Using Local Storage"}
            >
              {useDatabase ? (
                <Database className="size-3" />
              ) : (
                <HardDrive className="size-3" />
              )}
            </button>
            <ModeToggle />
          </div>
          
          <SavedRequestList
            savedRequests={savedRequests}
            activeRequestId={activeRequestId}
            handleLoadRequest={handleLoadRequest}
            handleDeleteRequest={handleDeleteRequest}
          />

          {/* Sync to Database Button */}
          {!useDatabase && savedRequests.length > 0 && (
            <button
              onClick={syncToDatabase}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-4 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Upload className="size-4" />
              Sync to Database
            </button>
          )}
        </aside>
  )
}
