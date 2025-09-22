import { motion } from "framer-motion";

export default function DashboardCard({ title, value, emoji }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="p-6 text-center bg-gray-800 shadow-lg rounded-2xl"
    >
      <div className="text-4xl">{emoji}</div>
      <h2 className="mt-2 text-xl font-bold">{title}</h2>
      <p className="text-2xl">{value}</p>
    </motion.div>
  );
}