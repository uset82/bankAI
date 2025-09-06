import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen app-liquid-bg flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              AI Bank
            </h1>
            <p className="text-2xl md:text-3xl font-light mb-4 text-white/90">
              No menus, just ask.
            </p>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              BankID-secure, explainable AI, smart coupons, and NAV/Tax inbox.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <Link to="/console">
              <Button size="lg" className="group bg-white/10 hover:bg-white/20 border border-white/20 text-white text-lg px-8 py-4 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/20">
                Open Console
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6 mb-16"
          >
            <div className="glass-card p-6 rounded-2xl">
              <Shield className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-white">Secure</h3>
              <p className="text-white/70">BankID authentication with complete audit trail</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <MessageSquare className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-white">Voice Banking</h3>
              <p className="text-white/70">Natural conversation with AI-powered assistance</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <Zap className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-white">Smart Actions</h3>
              <p className="text-white/70">One decisive action per response</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
