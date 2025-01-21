import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function XChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sourceLang, setSourceLang] = useState("en"); // Language state
  const [isWelcomeMessageVisible, setIsWelcomeMessageVisible] = useState(true);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Make API call to backend
      const response = await fetch("http://127.0.0.1:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input, language: sourceLang }), // Send language to backend
      });

      const data = await response.json();

      if (response.ok) {
        if (data.escalate) {
          // Handle escalation
          await fetch("http://127.0.0.1:5000/api/escalate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: input, user: "user@example.com" }), // Replace with dynamic user email
          });

          const escalationMessage = {
            role: "ai",
            text: "Your query has been escalated to a human agent. They will get back to you shortly.",
          };
          setMessages((prev) => [...prev, escalationMessage]);
        } else {
          const aiResponse = {
            role: "ai",
            text: data.message, // Translated AI response
          };
          setMessages((prev) => [...prev, aiResponse]);
        }
      } else {
        const aiResponse = {
          role: "ai",
          text: "An error occurred while processing your message.",
        };
        setMessages((prev) => [...prev, aiResponse]);
      }
    } catch (error) {
      const aiResponse = {
        role: "ai",
        text: "An error occurred while communicating with the server.",
      };
      setMessages((prev) => [...prev, aiResponse]);
    }

    setInput("");
  };

  const MessageContent = ({ text }) => (
    <ReactMarkdown
      className="text-sm leading-relaxed"
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code
              className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );

  useEffect(() => {
    // Show welcome message when the component is mounted
    const welcomeMessage = {
      role: "ai",
      text: `
      🌟 Welcome to Vartalaap.AI! 🌟  
      I'm your User Assistant 🤖, here to help with various domains such as:
      - Medical 🏥
      - Banking 💳
      - E-commerce 🛒
      - And I can assist you in multiple languages 🌍!  
      How can I assist you today? Feel free to ask anything! 😊
    `,
    };
    setMessages([welcomeMessage]);
    setIsWelcomeMessageVisible(false); // Hide welcome message after it’s shown
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 16c4.418 0 8-3.582 8-8S16.418 0 12 0 4 3.582 4 8s3.582 8 8 8zM12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Vartalaap.AI
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Powered by your imagination, for you assistance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-lg ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-4"
                  : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50 text-white mr-4"
              }`}
            >
              <MessageContent text={message.text} />
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-4"
      >
        <div className="flex items-center space-x-3">
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-4 py-2"
          >
            <option value="en">English</option>
            <option value="bn">Bengali</option>
            <option value="fr">French</option>
            <option value="ml">Malyalam</option>
            <option value="hi">Hindi</option>
            <option value="zh-cn">Chinese</option>
          </select>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your query here..."
            className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default XChatInterface;
