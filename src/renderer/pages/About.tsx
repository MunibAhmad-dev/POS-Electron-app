import React from 'react';
import { Info, User, Phone, ShieldCheck, Cpu, Code, Database, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function About() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in max-w-4xl pb-10 mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">About Software</h1>
        <p className="text-muted-foreground text-sm mt-1">Information, licensing, and system versioning details.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Hero Section */}
        <Card className="overflow-hidden border-border/50 shadow-md relative">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 text-primary/5 pointer-events-none">
            <ShieldCheck size={280} />
          </div>
          <CardHeader className="bg-primary/5 pb-8 pt-8">
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-primary p-4 rounded-2xl shadow-lg border border-primary-foreground/20">
                <Info className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-2xl font-bold text-foreground tracking-wide">Restaurant POS System</CardTitle>
                <CardDescription className="text-sm font-medium mt-1">Version 1.0.0 (Premium Enterprise)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 relative z-10 space-y-4">
             <div className="bg-muted/30 p-5 rounded-xl border border-border">
               <p className="text-foreground/80 leading-relaxed">
                 This software provides a robust point of sale infrastructure designed for fast-paced commercial environments. 
                 Engineered with high-performance React and SQLite, it offers lightning-fast local processing, seamless dark mode, advanced analytics, and encrypted local storage to ensure your daily operations run flawlessly without cloud dependencies.
               </p>
             </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Developer Contact */}
          <Card className="shadow-sm border-blue-500/20 bg-blue-50/10 dark:bg-blue-900/10 overflow-hidden relative group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Lead Developer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-background p-3 rounded-xl border border-border shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Owner Name</p>
                  <p className="text-foreground font-bold text-lg">Munib Ahmad</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-background p-3 rounded-xl border border-border shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <Phone className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Direct Contact</p>
                  <p className="text-foreground font-bold text-lg font-mono tracking-tight">+92 329 8748232</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">System Engine</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="bg-muted/20 p-3 rounded-lg border border-border/50 text-center">
                 <Code size={18} className="mx-auto mb-2 text-primary" />
                 <p className="text-[10px] uppercase text-muted-foreground font-semibold">UI Framework</p>
                 <p className="font-bold text-sm">React + Shadcn</p>
              </div>
              <div className="bg-muted/20 p-3 rounded-lg border border-border/50 text-center">
                 <Database size={18} className="mx-auto mb-2 text-primary" />
                 <p className="text-[10px] uppercase text-muted-foreground font-semibold">Database Engine</p>
                 <p className="font-bold text-sm">SQLite Local</p>
              </div>
              <div className="bg-muted/20 p-3 rounded-lg border border-border/50 text-center">
                 <Cpu size={18} className="mx-auto mb-2 text-primary" />
                 <p className="text-[10px] uppercase text-muted-foreground font-semibold">Core Kernel</p>
                 <p className="font-bold text-sm">Electron.js</p>
              </div>
              <div className="bg-muted/20 p-3 rounded-lg border border-border/50 text-center">
                 <Clock size={18} className="mx-auto mb-2 text-primary" />
                 <p className="text-[10px] uppercase text-muted-foreground font-semibold">Uptime Mode</p>
                 <p className="font-bold text-sm">100% Offline</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* License */}
        <Card className="shadow-sm border-dashed">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-3 flex-1">
              <p className="text-sm font-semibold flex items-center gap-2"><ShieldCheck size={16} className="text-green-500"/> Commercial License Registered & Authorized</p>
              <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  <strong>Authorization:</strong> This highly customized application is exclusive intellectual property, secured and licensed directly for premium enterprise usage by Munib Ahmad.
                </p>
                <p>
                  <strong>Terms of Use:</strong> Unauthorized distribution, reverse-engineering, modification, database exploitation, or reselling of this software binary or its underlying assets is strictly prohibited by law without prior written consent.
                </p>
              </div>
            </div>
            <div className="shrink-0">
               <Badge variant="secondary" className="font-mono px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20">BUILD: PROD-1.0.0-EN</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
