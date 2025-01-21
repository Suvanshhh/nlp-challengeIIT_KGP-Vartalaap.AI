import React from "react";
import Navigation from "./Navigation"; // Import Navigation component
import { motion } from "framer-motion";
import { FaRobot, FaGithub } from "react-icons/fa";
import { FaBrain, FaLightbulb, FaLock } from "react-icons/fa";

function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Navigation Bar */}
      <Navigation />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg transform -rotate-12 mb-6">
              <FaRobot className="w-12 h-12 text-white mx-auto transform translate-y-4" />
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text"
          >
            VARTALAAP.ai
          </motion.h1>

          <motion.h6
            variants={itemVariants}
            className="text-3xl font-semibold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text"
          >
            Your AI-Powered Customer Support ChatBot
          </motion.h6>

          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-300 mb-9 max-w-2xl mx-auto leading-relaxed"
          >
            An AI-powered Customer service chatbot system that understands your needs and provides seamless assistance.
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Developed With ❤️ by KRS.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-6 flex-wrap"
          >
            <button
              onClick={() => window.location.href = "/chat"} // Update to window.location.href instead of navigate()
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
                       text-white rounded-xl font-semibold text-lg flex items-center gap-3 transform hover:-translate-y-1
                       transition-all duration-200 shadow-lg hover:shadow-2xl"
            >
              <FaRobot className="text-xl" />
              Start Chat
              <span className="inline-block animate-bounce">→</span>
            </button>
            <a
              href="https://github.com/Suvanshhh/nlpchallengeiitkgp"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gray-800/50 hover:bg-gray-800/70 backdrop-blur-lg
                       text-white rounded-xl font-semibold text-lg flex items-center gap-3
                       transform hover:-translate-y-1 transition-all duration-200 border border-gray-700"
            >
              <FaGithub className="text-xl" />
              View on GitHub
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-8 mt-20"
        >
          <FeatureCard
            icon={<FaBrain />}
            title="AI-Powered Intelligence"
            description="Advanced machine learning algorithms that understand your code context and provide smart suggestions."
            gradient="from-blue-500 to-blue-700"
          />
          <FeatureCard
            icon={<FaLightbulb />}
            title="Smart Solutions"
            description="Get instant help with debugging, optimization, and best practices across all programming languages."
            gradient="from-purple-500 to-purple-700"
          />
          <FeatureCard
            icon={<FaLock />}
            title="Secure & Private"
            description="Your code and conversations are encrypted and completely private. We take security seriously."
            gradient="from-pink-500 to-pink-700"
          />
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-gray-800/40 backdrop-blur-lg p-8 rounded-2xl border border-gray-700/50
                hover:border-gray-600/50 transition-all duration-300 group`}
    >
      <div
        className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center
                    transform group-hover:scale-110 transition-transform duration-300`}
      >
        <div className="text-white text-2xl">{icon}</div>
      </div>
      <h3 className="text-white text-xl font-semibold mt-6 mb-4">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default Home;
