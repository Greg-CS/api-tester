import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";

interface SavedRequest {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
  createdAt?: string;
}

type RequestSectionsParams = {
  method: string;
  setMethod: (method: string) => void;
  url: string;
  setUrl: (url: string) => void;
  handleRequest: () => void;
  loading: boolean;
  requestName: string;
  setRequestName: (name: string) => void;
  saveRequest: () => void;
  savedRequests: SavedRequest[];
  setSavedRequests: (requests: SavedRequest[]) => void;
  headers: string;
  setHeaders: (headers: string) => void;
  body: string;
  setBody: (body: string) => void;
  STORAGE_KEY: string;
};

export const RequestSection = ({
  method,
  setMethod,
  url,
  setUrl,
  handleRequest,
  loading,
  requestName,
  setRequestName,
  saveRequest,
  savedRequests,
  setSavedRequests,
  headers,
  setHeaders,
  body,
  setBody,
  STORAGE_KEY
}: RequestSectionsParams) => {
  return (
        <Card>
          <CardHeader>
            <CardTitle>Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Enter URL (e.g., https://api.example.com/data)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <button
                onClick={handleRequest}
                disabled={loading || !url}
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>

            {/* Save Request */}
            <div className="flex gap-2">
              <Input
                placeholder="Request name (optional)"
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                className="flex-1"
              />
              <button
                onClick={saveRequest}
                disabled={!url}
                className="rounded-md border border-input px-4 py-2 hover:bg-accent disabled:opacity-50"
              >
                Save
              </button>
              {savedRequests.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Clear all saved requests?")) {
                      setSavedRequests([]);
                      localStorage.removeItem(STORAGE_KEY);
                    }
                  }}
                  className="rounded-md border border-destructive px-4 py-2 text-destructive hover:bg-destructive/10"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headers">Headers (one per line, format: Key: Value)</Label>
              <Textarea
                id="headers"
                placeholder="Content-Type: application/json"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="min-h-[80px] font-mono text-sm"
              />
            </div>

            {method !== "GET" && (
              <div className="space-y-2">
                <Label htmlFor="body">Request Body (JSON)</Label>
                <Textarea
                  id="body"
                  placeholder='{"key": "value"}'
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>
  )
}
