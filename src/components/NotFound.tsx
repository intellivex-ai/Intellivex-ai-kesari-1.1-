import React from 'react'
import { motion } from 'framer-motion'
import { Home, MessageSquare, ArrowLeft } from 'lucide-react'

/**
 * NotFound — Custom 404 page shown when a user lands on an unknown route.
 * Linked from App.tsx router and from main.tsx for hash-based routing.
 */
export default function NotFound() {
  return (
    <div className="notfound-page">
      {/* Animated background orbs matching the login page style */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="notfound-container">
        {/* Large 404 */}
        <motion.div
          className="notfound-code"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          404
        </motion.div>

        {/* Animated divider */}
        <motion.div
          className="notfound-divider"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        />

        <motion.h1
          className="notfound-title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          Page Not Found
        </motion.h1>

        <motion.p
          className="notfound-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          The page you're looking for doesn't exist or has been moved.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          className="notfound-actions"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <button
            className="notfound-btn primary"
            onClick={() => window.location.href = '/'}
          >
            <Home size={15} />
            Go to Intellivex AI
          </button>
          <button
            className="notfound-btn secondary"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
        </motion.div>

        {/* Branding */}
        <motion.p
          className="notfound-brand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <MessageSquare size={12} />
          Intellivex AI · Kesari 1.1
        </motion.p>
      </div>
    </div>
  )
}
