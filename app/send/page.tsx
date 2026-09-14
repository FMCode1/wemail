"use client";

import { FormEvent, useEffect, useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";

export default function SendPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          throw new Error("Not authenticated");
        }

        const data = await response.json();

        setUserEmail(data.user.email);
      } catch (error) {
        console.error("LOAD USER ERROR:", error);
        setMessage("Please connect your Google account first.");
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const newFiles = Array.from(files);

    setAttachments((current) => [
      ...current,
      ...newFiles,
    ]);
  }

  function removeAttachment(index: number) {
    setAttachments((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSending(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("to", to);
      formData.append("subject", subject);
      formData.append("body", body);

      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch("/api/send-email", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let data: { error?: string; success?: boolean; message?: string };
      
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("SEND EMAIL NON-JSON RESPONSE:", responseText);
      
        throw new Error(
          `Server returned ${response.status}: ${responseText.slice(0, 300)}`
        );
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }      

      setMessage("Email sent successfully!");
      setTo("");
      setSubject("");
      setBody("");
      setAttachments([]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Compose Email
        </h1>

        <p className="mt-2 text-gray-600">
          Send an email through your connected Google account.
        </p>

        {userEmail && (
          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Sending from{" "}
            <span className="font-medium text-gray-900">
              {userEmail}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* To */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              To
            </label>

            <input
              type="email"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subject
            </label>

            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          {/* Rich text */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Message
            </label>

            <div className="mt-2">
              <RichTextEditor
                content={body}
                onChange={setBody}
              />
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Attachments
            </label>

            <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600 hover:bg-gray-100">
              <span>
                📎 Click to attach files
              </span>

              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span>📎</span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {file.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="ml-4 text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send */}
          <button
            type="submit"
            disabled={sending || loadingUser || !userEmail}
            className="w-full rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingUser
              ? "Loading account..."
              : sending
                ? "Sending..."
                : "Send Email"}
          </button>

          {message && (
            <p className="rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}