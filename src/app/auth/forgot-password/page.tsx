"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Password reset instructions sent to your email.");
            } else {
                setMessage(data?.error || "Something went wrong.");
            }
        } catch (error) {
            setMessage("Server error. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-foodeez-primary/10 to-foodeez-secondary/10 px-4">
            <Card className="w-full max-w-md shadow-2xl border-none">
                <CardHeader>
                    <CardTitle className="text-3xl md:text-4xl font-bold text-center text-foodeez-primary">
                        Forgot Password
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-lg font-medium">
                                Enter your registered email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="text-base py-6"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                        </Button>

                        {message && (
                            <Alert variant={message.includes('error') ? 'destructive' : 'default'}>
                                <AlertTitle>{message.includes('error') ? 'Error' : 'Success'}</AlertTitle>
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
