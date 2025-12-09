"use client";

import { useState, useEffect } from "react";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemHeader,
} from "@/components/atoms/item";
import { Input } from "@/components/atoms/input";
import { Textarea } from "@/components/atoms/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Label } from "@/components/atoms/label";
import { Trash2, Database, HardDrive } from "lucide-react";

interface SavedRequest {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
  createdAt?: string;
}

interface Question {
  id: string;
  text: string;
  answers: { id: string; text: string }[];
}

interface QuestionsResponse {
  authToken?: string;
  provider?: string;
  questions?: Question[];
}

const STORAGE_KEY = "api-tester-requests";

export default function Home() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("POST");
  const [headers, setHeaders] = useState("Content-Type: application/json; charset=utf-8");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [requestName, setRequestName] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<QuestionsResponse | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [useDatabase, setUseDatabase] = useState(true);
  const [storageLoading, setStorageLoading] = useState(true);

  // Load settings and requests on mount
  useEffect(() => {
    const loadData = async () => {
      setStorageLoading(true);
      try {
        // Load settings
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setUseDatabase(settings.useDatabase);
        }

        // Load requests from database
        const requestsRes = await fetch("/api/requests");
        if (requestsRes.ok) {
          const dbRequests = await requestsRes.json();
          if (dbRequests.length > 0) {
            setSavedRequests(dbRequests);
          } else {
            // Fallback to localStorage
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              setSavedRequests(JSON.parse(stored));
            }
          }
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setSavedRequests(JSON.parse(stored));
          }
        }
      } catch {
        // Fallback to localStorage on error
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSavedRequests(JSON.parse(stored));
        }
        setUseDatabase(false);
      } finally {
        setStorageLoading(false);
      }
    };
    loadData();
  }, []);

  // Toggle storage mode
  const toggleStorage = async () => {
    const newValue = !useDatabase;
    setUseDatabase(newValue);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useDatabase: newValue }),
      });
    } catch {
      // Silently fail, local state is already updated
    }
  };

  // Save request
  const saveRequest = async () => {
    const name = requestName || `${method} ${new URL(url).pathname}`;

    if (useDatabase) {
      try {
        const res = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, url, method, headers, body }),
        });
        if (res.ok) {
          const newRequest = await res.json();
          setSavedRequests([newRequest, ...savedRequests].slice(0, 50));
        }
      } catch {
        // Fallback to localStorage
        saveToLocalStorage(name);
      }
    } else {
      saveToLocalStorage(name);
    }
    setRequestName("");
  };

  const saveToLocalStorage = (name: string) => {
    const newRequest: SavedRequest = {
      id: Date.now().toString(),
      name,
      url,
      method,
      headers,
      body,
    };
    const updated = [newRequest, ...savedRequests].slice(0, 50);
    setSavedRequests(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Load a saved request
  const loadRequest = (id: string) => {
    const request = savedRequests.find((r) => r.id === id);
    if (request) {
      setUrl(request.url);
      setMethod(request.method);
      setHeaders(request.headers);
      setBody(request.body);
    }
  };

  // Delete a saved request
  const deleteRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRequests.filter((r) => r.id !== id);
    setSavedRequests(updated);

    if (useDatabase) {
      try {
        await fetch(`/api/requests?id=${id}`, { method: "DELETE" });
      } catch {
        // Already removed from state
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const parseHeaders = (headerString: string): Record<string, string> => {
    const result: Record<string, string> = {};
    headerString.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length) {
        result[key.trim()] = valueParts.join(":").trim();
      }
    });
    return result;
  };

  const handleRequest = async () => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setResponse(null);
    setStatus(null);

    try {
      const options: RequestInit = {
        method,
        headers: parseHeaders(headers),
      };

      if (body && method !== "GET") {
        options.body = body;
      }

      const res = await fetch(url, options);
      setStatus(res.status);
      const data = await res.text();
      
      // Handle 204 No Content
      if (res.status === 204 || !data) {
        setResponse("(No content - 204 response)");
        setParsedQuestions(null);
        return;
      }
      
      try {
        const parsed = JSON.parse(data);
        setResponse(JSON.stringify(parsed, null, 2));
        
        // Check if response contains questions
        if (parsed.questions && Array.isArray(parsed.questions)) {
          setParsedQuestions(parsed);
          setSelectedAnswers({});
        } else {
          setParsedQuestions(null);
        }
      } catch {
        setResponse(data);
        setParsedQuestions(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">API Tester</h1>
            {/* Storage Toggle */}
            <button
              onClick={toggleStorage}
              disabled={storageLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                useDatabase
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
              title={useDatabase ? "Using Database" : "Using Local Storage"}
            >
              {useDatabase ? (
                <>
                  <Database className="size-4" />
                  <span>DB</span>
                </>
              ) : (
                <>
                  <HardDrive className="size-4" />
                  <span>Local</span>
                </>
              )}
            </button>
          </div>
          
          {/* Saved Requests Dropdown */}
          {savedRequests.length > 0 && (
            <Select onValueChange={loadRequest}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Load saved request..." />
              </SelectTrigger>
              <SelectContent>
                {savedRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between group">
                    <SelectItem value={req.id} className="flex-1 pr-0">
                      <span className="font-mono text-xs mr-2">{req.method}</span>
                      <span className="truncate max-w-[180px]">{req.name}</span>
                    </SelectItem>
                    <button
                      onClick={(e) => deleteRequest(req.id, e)}
                      className="p-1.5 mr-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete request"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Request Section */}
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

        {/* Questions Display */}
        {parsedQuestions?.questions && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Verification Questions</CardTitle>
                {parsedQuestions.authToken && (
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    authToken: {parsedQuestions.authToken}
                  </code>
                )}
              </div>
              {parsedQuestions.provider && (
                <p className="text-sm text-muted-foreground">Provider: {parsedQuestions.provider}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {parsedQuestions.questions.map((question, qIndex) => (
                <div key={question.id} className="space-y-3">
                  <p className="font-medium">
                    {qIndex + 1}. {question.text}
                  </p>
                  <div className="grid gap-2 pl-4">
                    {question.answers.map((answer) => (
                      <label
                        key={answer.id}
                        className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          selectedAnswers[question.id] === answer.id
                            ? "border-primary bg-primary/10"
                            : "border-input hover:bg-accent"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={answer.id}
                          checked={selectedAnswers[question.id] === answer.id}
                          onChange={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [question.id]: answer.id,
                            }))
                          }
                          className="accent-primary"
                        />
                        <span>{answer.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Show selected answers as JSON for next API call */}
              {Object.keys(selectedAnswers).length > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-2">Selected Answers (for next API call):</p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(
                      {
                        authToken: parsedQuestions.authToken,
                        answers: Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
                          questionId,
                          answerId,
                        })),
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Response Section */}
        <Item variant="outline" className="flex-col items-start">
          <ItemHeader>
            <ItemTitle>Raw Response</ItemTitle>
            {status && (
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  status >= 200 && status < 300
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : status >= 400
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                }`}
              >
                Status: {status}
              </span>
            )}
          </ItemHeader>
          <ItemContent className="w-full">
            {error && (
              <ItemDescription className="text-red-500">{error}</ItemDescription>
            )}
            {response && (
              <Textarea
                readOnly
                value={response}
                className="min-h-[300px] font-mono text-sm"
              />
            )}
            {!response && !error && (
              <ItemDescription>Send a request to see the response</ItemDescription>
            )}
          </ItemContent>
        </Item>
      </div>
    </main>
  );
}
