"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

interface NavigationLink {
    href: string;
    label: string;
}

interface HeaderProps {
    logoUrl: string;
    siteName: string;
    navigationLinks: NavigationLink[];
    user?: {
        name: string;
        email: string;
    };
}

export default function Header({ logoUrl, siteName, navigationLinks, user }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-background border-b border-border flex items-center justify-between px-4 md:px-8 h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-2">
                <img 
                    src={logoUrl} 
                    alt={`${siteName} Logo`} 
                    width={36}
                    height={36}
                    className="object-cover"
                />
                <span className="text-xl font-bold text-accent">{siteName}</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 text-sm">
                {navigationLinks.map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className="hover:underline transition-colors text-foreground hover:text-accent"
                    >
                        {link.label}
                    </a>
                ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
                {user ? (
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-muted-foreground">
                            Welcome, {user.name}
                        </span>
                        <button className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                            Profile
                        </button>
                        <button className="text-sm px-3 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center space-x-3">
                        <button className="text-sm px-4 py-2 rounded-2xl border border-accent text-accent hover:bg-accent/10 transition-colors">
                            Sign In
                        </button>
                        <button className="text-sm px-4 py-2 rounded-2xl bg-accent text-white hover:bg-accent/90 transition-colors">
                            Sign Up
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle mobile menu"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50" 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        aria-label="Close mobile menu"
                    />
                    <div className="fixed top-0 right-0 h-full w-80 bg-card shadow-xl">
                        <div className="flex flex-col h-full">
                            {/* Mobile Menu Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <div className="flex items-center justify-center rounded-full overflow-hidden h-[72px] w-[72px]">
                                    <img 
                                        src={logoUrl} 
                                        alt={`${siteName} Logo`} 
                                        width={72}
                                        height={72}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Close mobile menu"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Mobile Navigation Links */}
                            <nav className="flex-1 p-4 space-y-4">
                                {navigationLinks.map((link) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className="block py-3 px-4 rounded-lg hover:bg-muted transition-colors text-card-foreground hover:text-accent"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </nav>

                            {/* Mobile Auth Buttons */}
                            <div className="p-4 border-t border-border space-y-3">
                                {user ? (
                                    <div className="space-y-3">
                                        <div className="text-center pb-2">
                                            <span className="text-sm text-muted-foreground">
                                                Welcome, {user.name}
                                            </span>
                                        </div>
                                        <button className="w-full text-sm px-4 py-3 rounded-2xl border border-border hover:bg-muted transition-colors">
                                            Profile
                                        </button>
                                        <button className="w-full text-sm px-4 py-3 rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <button className="w-full text-sm px-4 py-3 rounded-2xl border border-accent text-accent hover:bg-accent/10 transition-colors">
                                            Sign In
                                        </button>
                                        <button className="w-full text-sm px-4 py-3 rounded-2xl bg-accent text-white hover:bg-accent/90 transition-colors">
                                            Sign Up
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
