import { Trash2 } from 'lucide-react';
import React from 'react'
interface SavedRequest {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
  createdAt?: string;
}

type SavedRequestListParams = {
    savedRequests: SavedRequest[];
    activeRequestId: string | null;
    handleLoadRequest: (id: string) => void;
    handleDeleteRequest: (id: string, e: React.MouseEvent) => void;
}

{/* Saved Requests List */}
export const SavedRequestList = ({savedRequests, activeRequestId, handleLoadRequest, handleDeleteRequest}: SavedRequestListParams) => {
  return (
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {savedRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No saved requests</p>
            ) : (
              savedRequests.map((req: SavedRequest) => (
                <div
                  key={req.id}
                  className={`group flex items-center justify-between rounded-md transition-colors ${
                    activeRequestId === req.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  <button
                    onClick={() => handleLoadRequest(req.id)}
                    className="flex-1 flex items-center gap-2 px-3 py-2 text-left min-w-0"
                  >
                    <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                      req.method === "GET" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                      req.method === "POST" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                      req.method === "PUT" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                      req.method === "DELETE" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                    }`}>
                      {req.method}
                    </span>
                    <span className="truncate text-sm">{req.name}</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteRequest(req.id, e)}
                    className="p-1.5 mr-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete request"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </nav>
  )
}
