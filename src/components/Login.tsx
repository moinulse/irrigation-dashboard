import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) setErr(error.message);
    else onAuthed();
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        {/* Top header row */}
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:gap-8 md:text-left">
          {/* MMU logo placeholder */}
          <div className="h-16 w-40">
            <img src="/MMU.png" alt="MMU Logo" />
          </div>

          <div className="flex-1 space-y-3">
            <h1 className="text-2xl font-semibold md:text-3xl text-center">
              PROGRAM PENYELIDIKAN TRANSLASIONAL
            </h1>
            <div className="space-y-2 text-sm md:text-base text-center">
              <p>
                Sustainable Energy Solutions for Enhancing Societal Wellbeing
                and Resilient Future of Rural Communities
              </p>
              <p className="italic">
                IoT-Assisted Smart Agriculture Plot Prototype with Integrated
                Photovoltaic-Battery Renewable Energy System
              </p>
              <p className="font-semibold text-xl">
                Asean IVO Collaborative Research And Development
              </p>
              <p>On</p>
              <p className="italic text-lg">
                AI-Driven Smart Horticulture for Climate Sensitive Plant using
                Soil Analysis and Image Processing: A Tropical Perspective
              </p>
              <p className="text-md">
                <span className="font-semibold underline">
                  Ketua Penyelidik
                </span>{" "}
                (IPT): Dr. Lee It Ee
              </p>
            </div>
          </div>

          {/* ASEAN logo placeholder (top right) */}
          <div className="h-24 w-24">
            <img src="/ivo.png" alt="IVO Logo" />
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start lg:justify-between pt-6 items-center">
          {/* Left column: collaborators */}
          <div className="space-y-4 text-center lg:text-left">
            <p className="font-semibold">Dengan kolaborasi:</p>

            <div className="flex flex-col items-left gap-6 gap-y-14">
              <div className="flex w-1/2 items-center justify-center">
                <img src="/meme.png" alt="Meme Logo" />
              </div>
              <div className="flex w-1/2 items-center justify-center">
                <img src="/kementerian.png" alt="Kementerian Logo" />
              </div>
              <div className="flex w-1/2 items-center justify-center">
                <img src="/jpt.png" alt="JPT Logo" />
              </div>
            </div>
          </div>

          {/* Center column: login card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-xl text-center">
                  Dashboard Login
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={signIn}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {err && <p className="text-sm text-destructive">{err}</p>}
                  <Button className="w-full" disabled={loading} type="submit">
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground text-center">
                  Access restricted. Contact admin to get an account.
                </p>
              </CardFooter>
            </Card>
          </div>

          {/* Right column: partner logos */}
          <div className="flex flex-col items-end gap-4">
            <div className="w-32">
              <img src="/partner1.png" alt="Partner 1 logo" />
            </div>
            <div className="w-32">
              <img src="/partner2.png" alt="Partner 2 logo" />
            </div>
            <div className="w-32">
              <img src="/partner3.png" alt="Partner 3 logo" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
