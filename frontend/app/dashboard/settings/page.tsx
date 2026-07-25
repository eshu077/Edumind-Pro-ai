"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { updateProfile, uploadAvatar } from "@/lib/user-api";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveName() {
    if (!name.trim()) return;
    setIsSavingName(true);
    setError(null);
    try {
      const updated = await updateProfile(name.trim());
      updateUser({ name: updated.name });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 1500);
    } catch (err: any) {
      setError(err.message || "Couldn't save your name");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploadingAvatar(true);
    try {
      const updated = await uploadAvatar(file);
      updateUser({ avatar: updated.avatar });
    } catch (err: any) {
      setError(err.message || "Couldn't upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-medium text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-subtle">Manage your profile.</p>

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet text-lg font-medium text-violet-foreground"
          >
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name} fill sizes="64px" className="object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Camera className="h-4 w-4 text-white" />}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div>
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-subtle">{user.email}</p>
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="name">Display name</Label>
          <div className="flex gap-2">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={handleSaveName} isLoading={isSavingName}>
              {nameSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </Card>
    </div>
  );
}
