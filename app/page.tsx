"use client";

import { useState, useEffect } from "react";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemHeader,
} from "@/components/atoms/item";
import { Textarea } from "@/components/atoms/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Trash2, Database, HardDrive, Upload } from "lucide-react";
import { RequestSection } from "@/components/molecules/RequestLayout/RequestSection";
import { toast } from "sonner";
import { getRequests, createRequest, deleteRequest as deleteRequestAction } from "@/app/actions/requests";
import { getSettings, updateSettings } from "@/app/actions/settings";
import { SavedRequestList } from "@/components/molecules/RequestLayout/SavedRequestList";
import { Sidebar } from "@/components/molecules/Sidebar/Sidebar";

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
        const settingsResult = await getSettings();
        if (settingsResult.success && settingsResult.data) {
          setUseDatabase(settingsResult.data.useDatabase);
        }

        // Load requests from database
        const requestsResult = await getRequests();
        if (requestsResult.success && requestsResult.data && requestsResult.data.length > 0) {
          setSavedRequests(requestsResult.data.map(r => ({
            ...r,
            createdAt: r.createdAt?.toString(),
          })));
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
      await updateSettings(newValue);
    } catch {
      // Silently fail, local state is already updated
    }
  };

  // Save request
  const saveRequest = async () => {
    const name = requestName || `${method} ${new URL(url).pathname}`;

    if (useDatabase) {
      try {
        const result = await createRequest({ name, url, method, headers, body });
        if (result.success && result.data) {
          setSavedRequests([{
            ...result.data,
            createdAt: result.data.createdAt?.toString(),
          }, ...savedRequests].slice(0, 50));
          toast.success("Request saved to database");
        } else {
          // Fallback to localStorage
          saveToLocalStorage(name);
          toast.warning("Database unavailable, saved to local storage");
        }
      } catch {
        // Fallback to localStorage
        saveToLocalStorage(name);
        toast.warning("Request saved to local storage");
      }
    } else {
      saveToLocalStorage(name);
      toast.success("Request saved to local storage");
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

  // Sync local requests to database
  const syncToDatabase = async () => {
    if (savedRequests.length === 0) {
      toast.error("No requests to sync");
      return;
    }

    let synced = 0;
    let failed = 0;

    for (const req of savedRequests) {
      const result = await createRequest({
        name: req.name,
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      if (result.success) {
        synced++;
      } else {
        failed++;
      }
    }

    if (synced > 0) {
      toast.success(`Synced ${synced} request${synced > 1 ? "s" : ""} to database`);
      // Switch to database mode and reload
      setUseDatabase(true);
      await updateSettings(true);
      // Reload requests from database
      const requestsResult = await getRequests();
      if (requestsResult.success && requestsResult.data) {
        setSavedRequests(requestsResult.data.map(r => ({
          ...r,
          createdAt: r.createdAt?.toString(),
        })));
      }
    }
    if (failed > 0) {
      toast.error(`Failed to sync ${failed} request${failed > 1 ? "s" : ""}`);
    }
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
  const handleDeleteRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRequests.filter((r) => r.id !== id);
    setSavedRequests(updated);

    if (useDatabase) {
      await deleteRequestAction(id);
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

  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const handleLoadRequest = (id: string) => {
    setActiveRequestId(id);
    loadRequest(id);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          toggleStorage={toggleStorage}
          storageLoading={storageLoading}
          syncToDatabase={syncToDatabase}
          useDatabase={useDatabase}
          savedRequests={savedRequests}
          activeRequestId={activeRequestId}
          handleLoadRequest={handleLoadRequest}
          handleDeleteRequest={handleDeleteRequest}
        />

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <h1 className="text-3xl font-bold">API Tester</h1>

            <RequestSection
              method={method}
              setMethod={setMethod}
              url={url}
              setUrl={setUrl}
              handleRequest={handleRequest}
              loading={loading}
              requestName={requestName}
              setRequestName={setRequestName}
              saveRequest={saveRequest}
              savedRequests={savedRequests}
              setSavedRequests={setSavedRequests}
              headers={headers}
              setHeaders={setHeaders}
              body={body}
              setBody={setBody}
              STORAGE_KEY={STORAGE_KEY}
            />

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
        </div>
      </div>
    </main>
  );
}
