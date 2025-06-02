import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { base_url } from "../constants/axiosConfig";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const postMessage = async () => {
    try {
      if (!message.trim() && !selectedFile) {
        throw new Error("Prompt or image is required");
      }

      const formData = new FormData();
      if (message.trim()) {
        formData.append("prompt", message.trim());
      }
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      // For debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      const response = await axios.post(`${base_url}/api/generate`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.data || !response.data.response) {
        throw new Error("Invalid response from server");
      }

      return response.data;
    } catch (error) {
      console.error("Error in postMessage:", error);
      throw error;
    }
  };

  const mutation = useMutation({
    mutationFn: postMessage,
    onMutate: () => {
      setError(""); // Clear any previous errors
      // Add user message immediately
      setConversation((prev) => [
        ...prev,
        {
          role: "user",
          content:
            message.trim() ||
            (selectedFile
              ? `Sent image: ${selectedFile.name}`
              : "Sent an image"),
        },
        { role: "assistant", content: "typing...", isTyping: true },
      ]);
    },
    onSuccess: (data) => {
      setMessage("");
      setSelectedFile(null);
      // Replace typing indicator with actual response
      setConversation((prev) => {
        const newConversation = [...prev];
        const typingIndex = newConversation.findIndex(
          (msg) => msg.isTyping === true
        );
        if (typingIndex !== -1) {
          newConversation[typingIndex] = {
            role: "assistant",
            content: data.response,
          };
        }
        return newConversation;
      });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Sorry, there was an error processing your request.";
      setError(errorMessage);
      // Replace typing indicator with error message
      setConversation((prev) => {
        const newConversation = [...prev];
        const typingIndex = newConversation.findIndex(
          (msg) => msg.isTyping === true
        );
        if (typingIndex !== -1) {
          newConversation[typingIndex] = {
            role: "assistant",
            content: errorMessage,
          };
        }
        return newConversation;
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mutation.isPending) return; // Prevent multiple submissions
    mutation.mutate();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("File size should be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setError(""); // Clear any previous errors
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-800 hover:scrollbar-thumb-blue-400 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-100"
              }`}
            >
              {msg.role === "assistant" ? (
                msg.isTyping ? (
                  <div className="flex space-x-2">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-900/50 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-gray-800 border-t border-gray-700"
      >
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer p-2 text-gray-400 hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(""); // Clear error when user types
            }}
            placeholder="Type your message..."
            disabled={mutation.isPending}
            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            {mutation.isPending ? "Sending..." : "Send"}
          </button>
        </div>
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-400">
            Selected file: {selectedFile.name}
          </div>
        )}
      </form>
    </div>
  );
}
