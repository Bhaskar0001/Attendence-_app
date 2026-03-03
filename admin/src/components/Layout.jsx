import React from 'react';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-[#020617]">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-hidden relative">
                {/* Background Gradient Orbs for main content area */}
                <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="p-8 h-full relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
