// Home.jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import bgGif from "../assets/images/back.gif";


export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="relative flex flex-col items-center justify-center h-screen text-white"
      style={{
        backgroundImage: `url(${bgGif})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Optional: dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Content goes on top of overlay */}
      <div className="relative z-10 text-center">
        <motion.h1
          className="text-6xl font-bold mb-6"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          CodeVita
        </motion.h1>

        <motion.p
          className="text-lg mb-10 text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          The most fun and beginner friendly way to Learn, Grow and Explore .
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/login")}
          className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-xl shadow-lg"
        >
          Get Started 
        </motion.button>
      </div>
    </div>
  );
}
