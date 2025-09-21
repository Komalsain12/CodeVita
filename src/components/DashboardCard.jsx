import { motion } from "framer-motion";

export default function DashboardCard({ title, value, emoji }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gray-800 p-6 rounded-2xl shadow-lg text-center"
    >
      <div className="text-4xl">{emoji}</div>
      <h2 className="text-xl font-bold mt-2">{title}</h2>
      <p className="text-2xl">{value}</p>
    </motion.div>
  );
}
