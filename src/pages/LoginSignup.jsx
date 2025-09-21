"use client"

import { useState } from "react"
import { auth, googleProvider, githubProvider } from "../firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { Github, Mail, Lock, Chrome } from "lucide-react"
import bgGif from "../assets/images/background.gif";
export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      navigate("/dashboard")
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      navigate("/dashboard")
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGithubLogin = async () => {
    try {
      await signInWithPopup(auth, githubProvider)
      navigate("/dashboard")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    
    <div
      className="min-h-screen bg-black text-gray-100 flex items-center justify-center font-mono"
      style={{
        backgroundImage: `url(${bgGif})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-gray-900/95 border border-gray-700 p-8 rounded-xl w-full max-w-md shadow-lg">
        <h1 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
          {isLogin ? "Login to CodeVita" : "Create Your CodeVita Account"}
        </h1>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <div className="flex items-center bg-gray-800 border border-gray-600 rounded-lg px-3 py-2">
              <Mail className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-transparent flex-1 outline-none text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="flex items-center bg-gray-800 border border-gray-600 rounded-lg px-3 py-2">
              <Lock className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-transparent flex-1 outline-none text-gray-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg font-bold"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* Social Logins */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center bg-white text-black py-2 rounded-lg font-bold hover:bg-gray-200"
          >
            <Chrome className="h-5 w-5 mr-2" /> Continue with Google
          </button>

          <button
            onClick={handleGithubLogin}
            className="w-full flex items-center justify-center bg-gray-800 border border-gray-600 py-2 rounded-lg font-bold hover:bg-gray-700"
          >
            <Github className="h-5 w-5 mr-2" /> Continue with GitHub
          </button>
        </div>

        <p className="text-sm text-center mt-6">
          {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-cyan-400 hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  )
}
